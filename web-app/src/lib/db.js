import { supabase } from './supabaseClient';

/**
 * Aggregates scanned parts into the Master Collection (parts_inventory).
 * If a part exists (same part_num + color_id), increments quantity.
 * If new, inserts it.
 */
export async function addToMasterCollection(identifiedParts, userId) {
    if (!userId) {
        console.error("User ID required for adding to collection");
        return { error: "User not logged in" };
    }

    const results = [];
    const errors = [];

    for (const part of identifiedParts) {
        try {
            // 1. Check if exists
            const { data: existing, error: fetchError } = await supabase
                .from('parts_inventory')
                .select('*')
                .eq('user_id', userId)
                .eq('part_num', part.part_num)
                .eq('color_id', part.color_id)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "Row not found"
                throw fetchError;
            }

            if (existing) {
                // 2. Update
                const { error: updateError } = await supabase
                    .from('parts_inventory')
                    .update({ quantity: existing.quantity + part.quantity })
                    .eq('id', existing.id);

                if (updateError) throw updateError;
                results.push({ ...existing, quantity: existing.quantity + part.quantity, status: 'updated' });
            } else {
                // 3. Insert
                const { data: newPart, error: insertError } = await supabase
                    .from('parts_inventory')
                    .insert({
                        user_id: userId,
                        part_num: part.part_num,
                        color_id: part.color_id,
                        quantity: part.quantity,
                        name: part.name,
                        img_url: part.img_url
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;
                results.push({ ...newPart, status: 'inserted' });
            }
        } catch (err) {
            console.error(`Error processing part ${part.part_num}:`, err);
            errors.push({ part, error: err.message });
        }
    }

    return { results, errors };
}

export async function getUserParts(userId) {
    const { data, error } = await supabase
        .from('parts_inventory')
        .select('*')
        .eq('user_id', userId);

    if (error) throw error;
    return data || [];
}

export async function saveBuildHistory(build, userId) {
    const { error } = await supabase
        .from('build_history')
        .insert({
            user_id: userId,
            set_id: build.set_id,
            name: build.name,
            match_score: build.match_score,
            instruction_url: build.set_url || build.instruction_url,
            num_parts: build.num_parts,
            set_img_url: build.set_img_url
        });
    if (error) throw error;
}
