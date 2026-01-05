import { handleOptions, json } from '../_shared/http.ts';
import { createServiceClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const status = url.searchParams.get('status');
  const shareCode = url.searchParams.get('shareCode');

  const supabase = createServiceClient();

  try {
    if (req.method === 'GET') {
      // Single RFP
      if (id) {
        const { data, error } = await supabase
          .from('rfps')
          .select('*, quotes(*)')
          .eq('id', id)
          .single();
        if (error) return json({ error: 'RFP not found' }, { status: 404 });
        return json({ data });
      }

      // External share
      if (shareCode) {
        const { data, error } = await supabase
          .from('rfps')
          .select('*')
          .eq('share_code', shareCode)
          .eq('status', 'open')
          .single();
        if (error) return json({ error: 'RFP not found or not open' }, { status: 404 });
        return json({ data });
      }

      let query = supabase.from('rfps').select('*').order('created_at', { ascending: false });
      if (status) query = query.eq('status', status);
      const { data, error } = await query;
      if (error) return json({ error: error.message }, { status: 500 });
      return json({ data });
    }

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const required = ['company_name','contact_person','contact_email','headcount','budget_min','budget_max','destination','duration_days','deadline'];
      for (const f of required) {
        if (body[f] === undefined || body[f] === null || body[f] === '') {
          return json({ error: `Missing required field: ${f}` }, { status: 400 });
        }
      }

      const { data, error } = await supabase
        .from('rfps')
        .insert({
          company_name: body.company_name,
          contact_person: body.contact_person,
          contact_email: body.contact_email,
          contact_phone: body.contact_phone,
          headcount: body.headcount,
          budget_min: body.budget_min,
          budget_max: body.budget_max,
          destination: body.destination,
          duration_days: body.duration_days,
          departure_date: body.departure_date,
          special_requirements: body.special_requirements || [],
          custom_requirements: body.custom_requirements,
          deadline: body.deadline,
          status: body.status || 'draft',
          created_by: body.created_by,
        })
        .select()
        .single();

      if (error) return json({ error: error.message }, { status: 500 });
      return json({ data }, { status: 201 });
    }

    if (req.method === 'PUT') {
      const body = await req.json().catch(() => ({}));
      if (!id) return json({ error: 'Missing RFP ID' }, { status: 400 });

      const { data, error } = await supabase
        .from('rfps')
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) return json({ error: error.message }, { status: 500 });
      return json({ data });
    }

    if (req.method === 'DELETE') {
      if (!id) return json({ error: 'Missing RFP ID' }, { status: 400 });
      const { error } = await supabase.from('rfps').delete().eq('id', id);
      if (error) return json({ error: error.message }, { status: 500 });
      return json({ success: true });
    }

    return json({ error: 'Method not allowed' }, { status: 405 });
  } catch (e) {
    return json({ error: (e as Error).message || 'Internal server error' }, { status: 500 });
  }
});
