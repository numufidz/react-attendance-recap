const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.handler = async (event) => {
  // Validasi HTTP method
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { licenseKey, email, schoolName } = JSON.parse(event.body);

    // Validasi input
    if (!licenseKey || !email || !schoolName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'License key, email, dan school name diperlukan' })
      };
    }

    // 1. Cek license key valid di database
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', licenseKey.toUpperCase())
      .single();

    if (licenseError || !license) {
      console.error('License error:', licenseError);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Kode lisensi tidak valid' })
      };
    }

    // 2. Cek activation attempts (max 5)
    if (license.activation_attempts >= 5) {
      return {
        statusCode: 429,
        body: JSON.stringify({ 
          error: 'Terlalu banyak percobaan aktivasi. Hubungi support.' 
        })
      };
    }

    // 3. Generate & simpan OTP ke database
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 menit

    const { error: otpError } = await supabase
      .from('otp_codes')
      .insert([{
        license_key: licenseKey.toUpperCase(),
        otp_code: otp,
        expires_at: expiresAt
      }]);

    if (otpError) {
      console.error('OTP insert error:', otpError);
      throw new Error('Gagal menyimpan OTP');
    }

    // 4. Kirim OTP via Resend email
    const emailResult = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@attendance-recap.com',
      to: email,
      subject: 'Kode Aktivasi - Sistem Rekap Absensi',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
              .container { background-color: white; padding: 40px; border-radius: 8px; max-width: 500px; margin: 20px auto; }
              .header { color: #2563eb; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
              .school-name { color: #666; font-size: 14px; margin-bottom: 30px; }
              .otp-box { background-color: #f0f9ff; border: 2px solid #2563eb; padding: 30px; border-radius: 8px; text-align: center; margin: 30px 0; }
              .otp-code { font-size: 36px; font-weight: bold; color: #2563eb; letter-spacing: 5px; font-family: monospace; }
              .expiry { color: #dc2626; font-size: 12px; margin-top: 20px; }
              .warning { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; font-size: 13px; color: #7f1d1d; }
              .footer { color: #999; font-size: 12px; margin-top: 30px; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">🔐 Aktivasi Lisensi</div>
              <div class="school-name">Sekolah: <strong>${schoolName}</strong></div>
              
              <p>Terima kasih telah mengaktifkan Sistem Rekap Absensi. Masukkan kode di bawah untuk menyelesaikan aktivasi:</p>
              
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
                <div class="expiry">Kode berlaku selama 10 menit</div>
              </div>
              
              <div class="warning">
                ⚠️ <strong>Jangan bagikan kode ini ke siapa pun!</strong> Jika Anda tidak meminta kode ini, abaikan email ini.
              </div>
              
              <p>Jika Anda mengalami kesulitan, hubungi tim support kami.</p>
              
              <div class="footer">
                © 2025 Sistem Rekap Absensi - Powered by Matsanuba Management Technology
              </div>
            </div>
          </body>
        </html>
      `
    });

    if (!emailResult.data) {
      console.error('Email send error:', emailResult.error);
      throw new Error('Gagal mengirim OTP');
    }

    // 5. Increment activation attempts di database
    await supabase
      .from('licenses')
      .update({ activation_attempts: license.activation_attempts + 1 })
      .eq('license_key', licenseKey.toUpperCase());

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'OTP terkirim ke email Anda',
        expiresIn: 600 // 10 menit dalam detik
      })
    };

  } catch (error) {
    console.error('Error in send-otp:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Terjadi kesalahan saat mengirim OTP. Silakan coba lagi.' 
      })
    };
  }
};
