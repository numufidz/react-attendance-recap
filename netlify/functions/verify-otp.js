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
    const { licenseKey, otp } = JSON.parse(event.body);

    // Validasi input
    if (!licenseKey || !otp) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'License key dan OTP diperlukan' })
      };
    }

    // 1. Cek OTP valid, belum digunakan, dan belum expired
    const { data: otpRecord, error: otpError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('license_key', licenseKey.toUpperCase())
      .eq('otp_code', otp)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpRecord) {
      console.error('OTP validation error:', otpError);
      return {
        statusCode: 401,
        body: JSON.stringify({ 
          error: 'Kode OTP salah atau sudah expired. Silakan coba lagi.' 
        })
      };
    }

    // 2. Mark OTP sebagai used
    const { error: updateOtpError } = await supabase
      .from('otp_codes')
      .update({ used: true })
      .eq('id', otpRecord.id);

    if (updateOtpError) {
      console.error('Update OTP error:', updateOtpError);
      throw new Error('Gagal memperbarui status OTP');
    }

    // 3. Update license status ke active dan reset activation_attempts
    const { data: license, error: updateLicenseError } = await supabase
      .from('licenses')
      .update({
        status: 'active',
        last_validated: new Date().toISOString(),
        activation_attempts: 0
      })
      .eq('license_key', licenseKey.toUpperCase())
      .select()
      .single();

    if (updateLicenseError || !license) {
      console.error('License update error:', updateLicenseError);
      throw new Error('Gagal mengaktifkan lisensi');
    }

    // 4. Generate JWT token (valid 30 hari)
    const token = jwt.sign(
      {
        licenseKey: license.license_key,
        schoolName: license.school_name,
        email: license.email,
        expiresAt: license.expires_at
      },
      process.env.JWT_SECRET || 'default-secret-key-change-in-production',
      { expiresIn: '30d' }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Aktivasi berhasil!',
        token: token,
        schoolName: license.school_name,
        expiresAt: license.expires_at,
        activatedAt: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Error in verify-otp:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Terjadi kesalahan saat verifikasi OTP. Silakan coba lagi.'
      })
    };
  }
};
