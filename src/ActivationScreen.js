import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

export default function ActivationScreen({ onActivationSuccess }) {
  const [licenseKey, setLicenseKey] = useState('');
  const [schoolEmail, setSchoolEmail] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('license'); // license, otp
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expiresIn, setExpiresIn] = useState(0);

  const handleSendOTP = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/.netlify/functions/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: licenseKey.toUpperCase(),
          email: schoolEmail,
          schoolName
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengirim OTP');
      }

      setSuccess('✅ OTP berhasil dikirim ke email Anda');
      setExpiresIn(data.expiresIn);
      setStep('otp');

      // Start countdown timer
      startCountdown(data.expiresIn);
    } catch (err) {
      setError('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = (seconds) => {
    let remaining = seconds;
    const interval = setInterval(() => {
      remaining--;
      setExpiresIn(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/.netlify/functions/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: licenseKey.toUpperCase(),
          otp
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal verifikasi OTP');
      }

      // Decode JWT untuk ekstrak licenseKey dari claim
      const tokenParts = data.token.split('.');
      let licenseKeyFromJWT = null;
      
      if (tokenParts.length === 3) {
        try {
          const decodedPayload = JSON.parse(atob(tokenParts[1]));
          licenseKeyFromJWT = decodedPayload.licenseKey;
        } catch (e) {
          console.warn('Gagal decode JWT payload:', e);
        }
      }

      // Simpan token ke localStorage (encrypted dengan base64)
      // Simpan licenseKey yang diektrak dari JWT payload
      localStorage.setItem('licenseToken', btoa(JSON.stringify({
        token: data.token,
        licenseKey: licenseKeyFromJWT || 'UNKNOWN',
        schoolName: data.schoolName,
        expiresAt: data.expiresAt,
        activatedAt: new Date().toISOString()
      })));

      setSuccess('✅ Aktivasi berhasil! Aplikasi sedang dimuat...');
      
      // Tunggu 1 detik sebelum callback
      setTimeout(() => {
        onActivationSuccess({
          token: data.token,
          licenseKey: licenseKeyFromJWT || 'UNKNOWN',
          schoolName: data.schoolName,
          expiresAt: data.expiresAt
        });
      }, 1000);
    } catch (err) {
      setError('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('license');
    setOtp('');
    setError('');
    setSuccess('');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔐</div>
          <h2 className="text-2xl font-bold text-gray-800">Aktivasi Lisensi</h2>
          <p className="text-sm text-gray-600 mt-2">Sistem Rekap Absensi</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex gap-3">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <div className="text-sm">{error}</div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex gap-3">
            <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
            <div className="text-sm">{success}</div>
          </div>
        )}

        {/* License Key Step */}
        {step === 'license' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kode Lisensi
              </label>
              <input
                type="text"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: XXXX-XXXX-XXXX-XXXX (sesuai dengan email aktivasi Anda)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Sekolah
              </label>
              <input
                type="text"
                placeholder="Masukkan nama sekolah Anda"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Sekolah
              </label>
              <input
                type="email"
                placeholder="sekolah@email.com"
                value={schoolEmail}
                onChange={(e) => setSchoolEmail(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <button
              onClick={handleSendOTP}
              disabled={loading || !licenseKey || !schoolEmail || !schoolName}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Mengirim OTP...
                </>
              ) : (
                'Kirim Kode OTP'
              )}
            </button>

            <p className="text-xs text-gray-600 text-center">
              Belum punya kode lisensi?{' '}
              <a href="#" className="text-blue-600 hover:underline">
                Hubungi support
              </a>
            </p>
          </div>
        )}

        {/* OTP Verification Step */}
        {step === 'otp' && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700">
                Kode OTP telah dikirim ke:{' '}
                <span className="font-semibold text-blue-700">{schoolEmail}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Masukkan Kode OTP (6 digit)
              </label>
              <input
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength="6"
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-center text-3xl tracking-widest font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                Kode berlaku selama{' '}
                <span className={expiresIn <= 60 ? 'text-red-600 font-semibold' : ''}>
                  {Math.floor(expiresIn / 60)}:{String(expiresIn % 60).padStart(2, '0')}
                </span>
              </p>
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={loading || otp.length !== 6}
              className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Verifikasi...
                </>
              ) : (
                '✓ Aktivasi'
              )}
            </button>

            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full text-gray-600 hover:text-gray-800 py-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Kembali
            </button>

            <p className="text-xs text-gray-600 text-center">
              Tidak menerima kode?{' '}
              <button
                onClick={handleReset}
                className="text-blue-600 hover:underline font-medium"
              >
                Kirim ulang
              </button>
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            © 2025 Sistem Rekap Absensi<br />
            Powered by Matsanuba Management Technology
          </p>
        </div>
      </div>
    </div>
  );
}
