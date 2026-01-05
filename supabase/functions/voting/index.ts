import { handleOptions, json } from '../_shared/http.ts';
import { createServiceClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const url = new URL(req.url);
  const action = url.searchParams.get('action') || '';
  const supabase = createServiceClient();

  try {
    switch (action) {
      case 'list':
        {
          const { data, error } = await supabase
            .from('vote_polls')
            .select('*, vote_options(*)')
            .order('created_at', { ascending: false });
          if (error) return json({ error: error.message }, { status: 500 });
          return json({ data });
        }

      case 'get':
        {
          const id = url.searchParams.get('id');
          const voterId = url.searchParams.get('voterId');
          if (!id) return json({ error: 'Missing poll ID' }, { status: 400 });

          const { data: poll, error: pollError } = await supabase
            .from('vote_polls')
            .select('*, vote_options(*)')
            .eq('id', id)
            .single();

          if (pollError) return json({ error: 'Poll not found' }, { status: 404 });

          let voterChoice: string | null = null;
          if (voterId) {
            const { data: vote } = await supabase
              .from('vote_records')
              .select('option_id')
              .eq('poll_id', id)
              .eq('voter_id', voterId)
              .single();
            voterChoice = (vote as any)?.option_id || null;
          }

          return json({ data: { ...(poll as any), voterChoice } });
        }

      case 'create':
        {
          if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });
          const body = await req.json().catch(() => ({}));
          const { title, description, deadline, createdByRole, options } = body;

          if (!title || !deadline || !Array.isArray(options) || options.length < 2) {
            return json({ error: 'Missing required fields' }, { status: 400 });
          }

          const { data: poll, error: pollError } = await supabase
            .from('vote_polls')
            .insert({
              title,
              description,
              deadline,
              created_by_role: createdByRole || 'welfare_committee',
              status: 'active',
            })
            .select()
            .single();

          if (pollError) return json({ error: pollError.message }, { status: 500 });

          const optionsToInsert = options.filter(Boolean).map((label: string) => ({
            poll_id: (poll as any).id,
            label,
            vote_count: 0,
          }));

          const { error: optionsError } = await supabase.from('vote_options').insert(optionsToInsert);
          if (optionsError) {
            await supabase.from('vote_polls').delete().eq('id', (poll as any).id);
            return json({ error: optionsError.message }, { status: 500 });
          }

          const { data: completePoll } = await supabase
            .from('vote_polls')
            .select('*, vote_options(*)')
            .eq('id', (poll as any).id)
            .single();

          return json({ data: completePoll }, { status: 201 });
        }

      case 'vote':
        {
          if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });
          const body = await req.json().catch(() => ({}));
          const { pollId, voterId, optionId } = body;
          if (!pollId || !voterId || !optionId) {
            return json({ error: 'Missing required fields' }, { status: 400 });
          }

          const { data: existingVote } = await supabase
            .from('vote_records')
            .select('id, option_id')
            .eq('poll_id', pollId)
            .eq('voter_id', voterId)
            .single();

          if (existingVote) {
            if ((existingVote as any).option_id === optionId) {
              return json({ message: 'Already voted for this option' });
            }

            await supabase.rpc('decrement_vote_count', { opt_id: (existingVote as any).option_id });
            await supabase.from('vote_records').update({ option_id: optionId }).eq('id', (existingVote as any).id);
            await supabase.rpc('increment_vote_count', { opt_id: optionId });
            return json({ message: 'Vote changed successfully' });
          }

          const { error: voteError } = await supabase
            .from('vote_records')
            .insert({ poll_id: pollId, voter_id: voterId, option_id: optionId });

          if (voteError) return json({ error: voteError.message }, { status: 500 });
          await supabase.rpc('increment_vote_count', { opt_id: optionId });
          return json({ message: 'Vote recorded successfully' });
        }

      case 'delete':
        {
          if (req.method !== 'DELETE') return json({ error: 'Method not allowed' }, { status: 405 });
          const id = url.searchParams.get('id');
          if (!id) return json({ error: 'Missing poll ID' }, { status: 400 });
          const { error } = await supabase.from('vote_polls').delete().eq('id', id);
          if (error) return json({ error: error.message }, { status: 500 });
          return json({ success: true });
        }

      default:
        return json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (e) {
    return json({ error: (e as Error).message || 'Internal server error' }, { status: 500 });
  }
});
