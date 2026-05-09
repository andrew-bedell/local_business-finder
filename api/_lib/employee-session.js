export async function requireEmployeeSession(req, { supabaseUrl, serviceKey, requireAdmin = false } = {}) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw Object.assign(new Error('Missing authorization header'), { status: 401 });
  }

  const token = authHeader.slice(7);
  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!userRes.ok) {
    throw Object.assign(new Error('Invalid token'), { status: 401 });
  }

  const user = await userRes.json();
  const employeeRes = await fetch(
    `${supabaseUrl}/rest/v1/employees?auth_user_id=eq.${encodeURIComponent(user.id)}&is_active=eq.true&select=id,auth_user_id,email,display_name,role`,
    {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!employeeRes.ok) {
    throw Object.assign(new Error('Failed to validate employee access'), { status: 502 });
  }

  const employees = await employeeRes.json();
  if (!Array.isArray(employees) || employees.length === 0) {
    throw Object.assign(new Error('Employee access required'), { status: 403 });
  }

  const employee = employees[0];
  if (requireAdmin && employee.role !== 'admin') {
    throw Object.assign(new Error('Admin access required'), { status: 403 });
  }

  return { user, employee, token };
}

export async function ensureEmployeeSession(req, res, options) {
  try {
    return await requireEmployeeSession(req, options);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
    return null;
  }
}
