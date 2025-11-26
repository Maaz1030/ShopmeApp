const SERVER_KEY =
  'AAAAPgEHsW0:APA91bEe5GADS348QvLrAyWi8NWiLc1cJjU6ta-PaUjtOdi_zJ0VX1FuZ-oBOEzzWG4H0EF-oobxdrnHXgURhdOIKIiJldsnDK-4ZZdep_ocr1fSMJDBr7Fnb3Tf8IEbBmf7gak37k9N';

export const sendPushNotification = async (token, title, body, data = {}) => {
  try {
    // 💡 UPDATED PAYLOAD: Using only the 'data' field for strict Legacy API compatibility
    const payload = {
      to: token,
      priority: 'high',
      
      // All content is moved here. The client must display the notification manually.
      data: {
        title: title,
        body: body,
        sound: 'default',
        android_channel_id: 'default_channel',
        ...data, // Spread custom data (like chatId) here
      },
    };

    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${SERVER_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const resText = await response.text();
    console.log('🔹 FCM status:', response.status);

    if (response.status !== 200) {
      console.error('❌ FCM PUSH FAILED! Full Response:', resText);
      if (response.status === 404) {
        console.error('DEBUG HINT: 404 means the combination of key/endpoint is rejected.');
      }
    } else {
      console.log('✅ FCM body:', resText);
    }
  } catch (error) {
    console.log('sendPushNotification error:', error);
  }
};