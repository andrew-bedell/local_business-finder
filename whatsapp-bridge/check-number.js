// WhatsApp number check endpoint — verifies if a phone number is registered on WhatsApp
// Isolated module: require('./check-number')(httpApp, client)

module.exports = function (httpApp, client) {
  httpApp.post('/check-number', async (req, res) => {
    const { phone, secret } = req.body || {};

    // Validate shared secret
    const expectedSecret = process.env.BRIDGE_API_SECRET;
    if (!expectedSecret || secret !== expectedSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!phone) {
      return res.status(400).json({ error: 'Missing required field: phone' });
    }

    // Check WhatsApp client readiness
    const info = client.info;
    if (!info) {
      return res.status(503).json({ error: 'WhatsApp client not ready' });
    }

    try {
      const digits = phone.replace(/[^\d]/g, '');
      const candidates = [digits];

      // Mexico: try both with and without the "1"
      if (digits.startsWith('52') && digits.length === 12) {
        candidates.push('521' + digits.slice(2));
      }
      if (digits.startsWith('521') && digits.length === 13) {
        candidates.push('52' + digits.slice(3));
      }

      // Colombia: same pattern
      if (digits.startsWith('57') && digits.length === 12) {
        candidates.push('571' + digits.slice(2));
      }
      if (digits.startsWith('571') && digits.length === 13) {
        candidates.push('57' + digits.slice(3));
      }

      // Try each candidate sequentially
      for (const candidate of candidates) {
        const result = await client.getNumberId(candidate + '@c.us');
        if (result) {
          console.log(`[HTTP API] Number check: ${digits} → registered (matched ${candidate})`);
          return res.status(200).json({ registered: true, jid: result._serialized });
        }
      }

      console.log(`[HTTP API] Number check: ${digits} → not registered (tried ${candidates.join(', ')})`);
      return res.status(200).json({ registered: false, jid: null });
    } catch (err) {
      console.error('[HTTP API] Number check failed:', err.message);
      return res.status(500).json({ error: 'Check failed', detail: err.message });
    }
  });
};
