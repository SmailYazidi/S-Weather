import { NextResponse } from 'next/server';
import { Twilio } from 'twilio';

export async function POST() {
  try {
const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const weatherApiKey = process.env.WEATHER_API_KEY!;

    const client = new Twilio(accountSid, authToken);



    const city = 'Ain Leuh';  // هنا المدينة المعدلة
    const res = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${encodeURIComponent(city)}&days=14&lang=ar`
    );

    if (!res.ok) {
      return NextResponse.json({ error: 'فشل جلب بيانات الطقس' }, { status: 500 });
    }

    const data = await res.json();
    const forecastDays = data.forecast.forecastday;

    // بناء نص الرسالة
    let message = `📅 توقعات الطقس لمدة 14 يومًا في ${city}:\n\n`;

    forecastDays.forEach((day: any, index: number) => {
      const date = day.date;
      const condition = day.day.condition.text;
      const avgTemp = day.day.avgtemp_c;

      // اختيار رمز تعبيري بسيط بناء على الحالة الجوية
      let emoji = '🌤️'; // رمز افتراضي

      if (condition.includes('مشمس') || condition.includes('صحو')) emoji = '☀️';
      else if (condition.includes('ممطر') || condition.includes('مطر')) emoji = '🌧️';
      else if (condition.includes('غائم')) emoji = '⛅';
      else if (condition.includes('عاصف') || condition.includes('رياح')) emoji = '🌬️';
      else if (condition.includes('ثلج')) emoji = '❄️';

      message += `${index + 1}️⃣ ${date}: ${emoji} ${condition}، متوسط الحرارة: ${avgTemp}°C\n`;
    });

    message += `\n🔆 طقس آمن وممتع!`;

    const msg = await client.messages.create({
      from: 'whatsapp:+14155238886',
      to: 'whatsapp:+212684378414', // ← رقم والدك بصيغة المغرب
      body: message,
    });

    return NextResponse.json({ success: true, sid: msg.sid, message });
  } catch (error: any) {
    console.error('❌ خطأ في الإرسال:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}