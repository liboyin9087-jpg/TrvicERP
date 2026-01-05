import { handleOptions, json } from '../_shared/http.ts';
import { createServiceClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const url = new URL(req.url);
  const supabase = createServiceClient();

  try {
    if (req.method === 'GET') {
      const id = url.searchParams.get('id');
      const severity = url.searchParams.get('severity');
      const supplierType = url.searchParams.get('supplierType');
      const verified = url.searchParams.get('verified');
      const search = url.searchParams.get('search');
      const limit = Number(url.searchParams.get('limit') || 50);

      if (id) {
        const { data, error } = await supabase.from('warning_reports').select('*').eq('id', id).single();
        if (error) return json({ error: 'Warning not found' }, { status: 404 });
        return json({ data });
      }

      let query = supabase.from('warning_reports').select('*').order('created_at', { ascending: false }).limit(limit);
      if (severity) query = query.eq('severity', severity);
      if (supplierType) query = query.eq('supplier_type', supplierType);
      if (verified !== null && verified !== undefined) {
        if (verified === 'true' || verified === 'false') query = query.eq('verified', verified === 'true');
      }
      if (search) {
        query = query.or(`supplier_name.ilike.%${search}%,issue_title.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) return json({ error: error.message }, { status: 500 });
      return json({ data });
    }

    if (req.method === 'POST') {
      const action = url.searchParams.get('action');
      const body = await req.json().catch(() => ({}));

      if (action === 'vote') {
        const { warningId, voterId, voteType } = body;
        if (!warningId || !voterId || !voteType) return json({ error: 'Missing required fields' }, { status: 400 });
        if (!['up','down'].includes(voteType)) return json({ error: 'Invalid vote type' }, { status: 400 });

        const { data: existingVote } = await supabase
          .from('warning_votes')
          .select('*')
          .eq('warning_id', warningId)
          .eq('voter_id', voterId)
          .single();

        if (existingVote) {
          if ((existingVote as any).vote_type === voteType) {
            await supabase.from('warning_votes').delete().eq('id', (existingVote as any).id);
            return json({ message: 'Vote removed' });
          }
          await supabase.from('warning_votes').update({ vote_type: voteType }).eq('id', (existingVote as any).id);
          return json({ message: 'Vote changed' });
        }

        const { error } = await supabase.from('warning_votes').insert({ warning_id: warningId, voter_id: voterId, vote_type: voteType });
        if (error) return json({ error: error.message }, { status: 500 });
        return json({ message: 'Vote recorded' });
      }

      // Create new warning
      const required = ['supplier_name','supplier_type','severity','issue_title','issue_description'];
      for (const f of required) {
        if (!body[f]) return json({ error: `Missing required field: ${f}` }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('warning_reports')
        .insert({
          supplier_name: body.supplier_name,
          supplier_type: body.supplier_type,
          location: body.location,
          city: body.city,
          country: body.country || 'Japan',
          severity: body.severity,
          issue_title: body.issue_title,
          issue_description: body.issue_description,
          incident_date: body.incident_date,
          evidence_urls: body.evidence_urls || [],
          reported_by: body.reported_by,
          reporter_agency: body.reporter_agency,
          tags: body.tags || [],
          report_count: 1,
          verified: false,
          resolution_status: 'open',
        })
        .select()
        .single();

      if (error) return json({ error: error.message }, { status: 500 });
      return json({ data }, { status: 201 });
    }

    if (req.method === 'PUT') {
      const id = url.searchParams.get('id');
      if (!id) return json({ error: 'Missing warning ID' }, { status: 400 });
      const body = await req.json().catch(() => ({}));

      const { data, error } = await supabase
        .from('warning_reports')
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) return json({ error: error.message }, { status: 500 });
      return json({ data });
    }

    return json({ error: 'Method not allowed' }, { status: 405 });
  } catch (e) {
    return json({ error: (e as Error).message || 'Internal server error' }, { status: 500 });
  }
});
