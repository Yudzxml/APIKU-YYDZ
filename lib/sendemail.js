import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true,
  auth: {
    user: "support@yydz.my.id",
    pass: "BBEXMhPKtBLC",
  },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 10000,
  greetingTimeout: 5000,
  socketTimeout: 10000,
});

async function sendMail(subject, message) {
  try {
    await transporter.verify();
    const info = await transporter.sendMail({
      from: "support@yydz.my.id",
      to: "support@support.whatsapp.com",
      subject,
      text: message,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    if (err.message.includes("Timeout") || err.message.includes("ETIMEDOUT")) {
      try {
        const fallbackTransporter = nodemailer.createTransport({
          host: "smtp.zoho.com",
          port: 587,
          secure: false,
          auth: {
            user: "support@yydz.my.id",
            pass: "BBEXMhPKtBLC",
          },
          tls: { rejectUnauthorized: false },
        });
        const info = await fallbackTransporter.sendMail({
          from: "support@yydz.my.id",
          to: "smb@support.whatsapp.com",
          subject,
          text: message,
        });
        return { success: true, messageId: info.messageId, fallback: true };
      } catch (fallbackError) {
        return { success: false, error: fallbackError.message, fallback: true };
      }
    }
    return { success: false, error: err.message };
  }
}

async function unban(number = "+6283872031397") {
  const name = "Yuda Arya Ardhana";
  const messages = [
    // 🇬🇧 English
    {
      subject: `Appeal for Account Restoration – WhatsApp Number: ${number}`,
      body: `Dear WhatsApp Support Team,

I hope this message finds you well. I am writing to respectfully request the restoration of my WhatsApp account associated with the number ${number}.

My account was recently restricted or suspended, possibly due to an automated error or misunderstanding. I assure you that I have always used WhatsApp according to the Terms of Service and Community Guidelines. I rely on this account daily for essential communications with family, clients, and colleagues. Losing access to it has caused significant disruption to my personal and professional life.

Please review my account and consider restoring access as soon as possible. I am willing to provide any information necessary to verify my identity.

Thank you for your time and understanding.

Warm regards,
${name}
WhatsApp Number: ${number}`
    },

    // 🇮🇩 Indonesian
    {
      subject: `Permohonan Pemulihan Akun – Nomor WhatsApp: ${number}`,
      body: `Kepada Tim Dukungan WhatsApp yang terhormat,

Saya berharap pesan ini diterima dengan baik. Saya ingin mengajukan permohonan agar akun WhatsApp saya dengan nomor ${number} dapat segera dipulihkan.

Akun saya baru-baru ini dibatasi atau ditangguhkan, kemungkinan karena kesalahan sistem atau kesalahpahaman. Saya meyakinkan bahwa saya selalu menggunakan WhatsApp sesuai dengan Ketentuan Layanan dan Pedoman Komunitas. Saya menggunakan akun ini setiap hari untuk berkomunikasi dengan keluarga, klien, dan rekan kerja. Kehilangan akses ke akun ini sangat mengganggu kegiatan pribadi maupun profesional saya.

Mohon untuk meninjau kembali akun saya dan memulihkan akses sesegera mungkin. Saya bersedia memberikan informasi tambahan untuk verifikasi identitas jika diperlukan.

Terima kasih atas perhatian dan pengertiannya.

Hormat saya,
${name}
Nomor WhatsApp: ${number}`
    },

    // 🇪🇸 Spanish
    {
      subject: `Solicitud de restauración de cuenta – Número de WhatsApp: ${number}`,
      body: `Estimado equipo de soporte de WhatsApp,

Espero que este mensaje les encuentre bien. Les escribo para solicitar respetuosamente la restauración de mi cuenta de WhatsApp asociada al número ${number}.

Mi cuenta fue restringida o suspendida recientemente, posiblemente debido a un error automático o malentendido. Les aseguro que siempre he utilizado WhatsApp de acuerdo con los Términos de Servicio y las Directrices de la Comunidad. Dependo de esta cuenta diariamente para comunicaciones esenciales con mi familia, clientes y colegas.

Por favor, revisen mi cuenta y consideren restaurar el acceso lo antes posible. Estoy dispuesto a proporcionar cualquier información necesaria para verificar mi identidad.

Gracias por su tiempo y comprensión.

Atentamente,
${name}
Número de WhatsApp: ${number}`
    },

    // 🇸🇦 Arabic
    {
      subject: `طلب استعادة الحساب – رقم واتساب: ${number}`,
      body: `فريق دعم واتساب المحترم،

أتمنى أن تكونوا بخير. أكتب لطلب استعادة حسابي على واتساب المرتبط بالرقم ${number}.

تم تقييد حسابي أو تعليقه مؤخرًا، وربما بسبب خطأ آلي أو سوء فهم. أؤكد أنني أستخدم واتساب دائمًا وفقًا لشروط الخدمة وإرشادات المجتمع. أعتمد على هذا الحساب يوميًا للتواصل مع عائلتي وعملائي وزملائي.

يرجى مراجعة حسابي والنظر في استعادته في أقرب وقت ممكن. أنا مستعد لتقديم أي معلومات ضرورية للتحقق من هويتي.

شكرًا لوقتكم وتفهمكم.

مع خالص التحية،
${name}
رقم واتساب: ${number}`
    },

    // 🇫🇷 French
    {
      subject: `Demande de restauration de compte – Numéro WhatsApp : ${number}`,
      body: `Chère équipe d'assistance WhatsApp,

J'espère que vous allez bien. Je vous écris pour demander la restauration de mon compte WhatsApp associé au numéro ${number}.

Mon compte a été restreint ou suspendu récemment, peut-être à cause d'une erreur automatique ou d'un malentendu. Je vous assure que j'ai toujours utilisé WhatsApp conformément aux Conditions d'utilisation et aux Règles de la communauté.

Je vous prie de bien vouloir examiner mon compte et envisager de rétablir l'accès dès que possible. Je peux fournir toute information nécessaire pour vérifier mon identité.

Cordialement,
${name}
Numéro WhatsApp : ${number}`
    },

    // 🇮🇳 Hindi
    {
      subject: `खाता पुनर्स्थापन के लिए अपील – व्हाट्सएप नंबर: ${number}`,
      body: `प्रिय व्हाट्सएप सहायता टीम,

आशा है आप कुशल हैं। मैं यह संदेश अपने व्हाट्सएप खाते (${number}) को पुनर्स्थापित करने के लिए सम्मानपूर्वक अनुरोध करने हेतु लिख रहा हूँ।

मेरा खाता हाल ही में प्रतिबंधित या निलंबित कर दिया गया है, संभवतः किसी स्वचालित त्रुटि या गलतफहमी के कारण। कृपया मेरा खाता पुनः सक्रिय करने पर विचार करें।

धन्यवाद सहित,
${name}
व्हाट्सएप नंबर: ${number}`
    },

    // 🇧🇷 Portuguese
    {
      subject: `Pedido de restauração de conta – Número do WhatsApp: ${number}`,
      body: `Prezada equipe de suporte do WhatsApp,

Espero que esta mensagem os encontre bem. Escrevo para solicitar respeitosamente a restauração da minha conta do WhatsApp associada ao número ${number}.

Minha conta foi recentemente suspensa ou restrita, possivelmente devido a um erro automatizado. Garanto que sempre usei o WhatsApp de acordo com os Termos de Serviço e as Diretrizes da Comunidade.

Agradeço antecipadamente por revisar meu caso.

Atenciosamente,
${name}
Número do WhatsApp: ${number}`
    },

    // 🇷🇺 Russian
    {
      subject: `Запрос на восстановление учетной записи – Номер WhatsApp: ${number}`,
      body: `Уважаемая команда поддержки WhatsApp,

Прошу восстановить мой аккаунт WhatsApp, связанный с номером ${number}. Моя учетная запись была недавно заблокирована, возможно, по ошибке или недоразумению.

Я всегда соблюдал Условия использования и Правила сообщества. Прошу рассмотреть мой запрос как можно скорее.

С уважением,
${name}
Номер WhatsApp: ${number}`
    },

    // 🇯🇵 Japanese
    {
      subject: `アカウント復元のお願い – WhatsApp番号: ${number}`,
      body: `WhatsAppサポートチーム様

いつもお世話になっております。私は、番号${number}に関連付けられたWhatsAppアカウントの復元をお願い申し上げます。

アカウントが誤って制限または停止された可能性があります。私は常に利用規約とコミュニティガイドラインに従ってWhatsAppを使用してきました。

ご確認のほどよろしくお願いいたします。

敬具
${name}
WhatsApp番号: ${number}`
    },

    // 🇰🇷 Korean
    {
      subject: `계정 복원 요청 – WhatsApp 번호: ${number}`,
      body: `WhatsApp 지원팀 귀중,

안녕하세요. 제 WhatsApp 계정(${number})이 제한되거나 정지된 것 같습니다. 이는 시스템 오류나 오해로 인한 것일 수 있습니다.

항상 서비스 약관을 준수해 왔음을 알려드립니다. 계정을 검토하시고 조속히 복원해 주시길 부탁드립니다.

감사합니다.
${name}
WhatsApp 번호: ${number}`
    },

    // 🇨🇳 Chinese (Simplified)
    {
      subject: `账户恢复请求 – WhatsApp号码：${number}`,
      body: `尊敬的WhatsApp支持团队：

您好！我写信是为了请求恢复与号码${number}关联的WhatsApp账户。

我的账户最近被限制或暂停，可能是由于系统错误或误解。我一直遵守WhatsApp的服务条款和社区准则。请审核并尽快恢复账户。

感谢您的时间与理解！

此致  
敬礼  
${name}  
WhatsApp号码：${number}`
    },

    // 🇩🇪 German
    {
      subject: `Antrag auf Kontowiederherstellung – WhatsApp-Nummer: ${number}`,
      body: `Sehr geehrtes WhatsApp-Support-Team,

ich möchte die Wiederherstellung meines WhatsApp-Kontos beantragen, das mit der Nummer ${number} verknüpft ist.

Mein Konto wurde kürzlich gesperrt, möglicherweise aufgrund eines automatischen Fehlers. Ich versichere, dass ich WhatsApp stets gemäß den Nutzungsbedingungen verwendet habe.

Ich bitte um eine baldige Prüfung und Wiederherstellung des Zugangs.

Mit freundlichen Grüßen,
${name}
WhatsApp-Nummer: ${number}`
    }
  ];
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

const sendemail = async (number) => {
  const { subject, body } = await unban(number);
  const result = await sendMail(subject, body)
  return result
};

export default sendemail