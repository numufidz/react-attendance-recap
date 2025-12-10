const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { token } = JSON.parse(event.body);

    if (!token) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Token diperlukan' })
      };
    }

    // 1. Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'default-secret-key-change-in-production'
      );
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError.message);
      return {
        statusCode: 401,
        body: JSON.stringify({ 
          error: 'Token invalid atau sudah expired. Silakan aktivasi ulang.' 
        })
      };
    }

    // 2. Cek license status di database
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', decoded.licenseKey)
      .single();

    if (licenseError || !license) {
      console.error('License not found:', licenseError);
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Lisensi tidak ditemukan di database' })
      };
    }

    // 3. Cek status lisensi aktif
    if (license.status !== 'active') {
      return {
        statusCode: 401,
        body: JSON.stringify({ 
          error: 'Lisensi tidak aktif. Silakan aktivasi terlebih dahulu.' 
        })
      };
    }

    // 4. Cek apakah lisensi sudah expired
    if (new Date(license.expires_at) < new Date()) {
      // Update status ke expired
      await supabase
        .from('licenses')
        .update({ status: 'expired' })
        .eq('license_key', decoded.licenseKey);

      return {
        statusCode: 401,
        body: JSON.stringify({ 
          error: 'Lisensi sudah expired. Hubungi support untuk renewal.' 
        })
      };
    }

    // 5. Update last_validated timestamp (untuk tracking penggunaan)
    const { error: updateError } = await supabase
      .from('licenses')
      .update({ last_validated: new Date().toISOString() })
      .eq('license_key', decoded.licenseKey);

    if (updateError) {
      console.error('Update validation error:', updateError);
      // Jangan throw error karena ini hanya tracking
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        valid: true,
        schoolName: license.school_name,
        email: license.email,
        expiresAt: license.expires_at,
        activatedAt: license.last_validated,
        daysRemaining: Math.ceil((new Date(license.expires_at) - new Date()) / (1000 * 60 * 60 * 24))
      })
    };

  } catch (error) {
    console.error('Error in validate-license:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Terjadi kesalahan saat validasi lisensi. Silakan coba lagi.'
      })
    };
  }
};
