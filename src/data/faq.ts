/**
 * Shared FAQ data — single source of truth for both
 * the client FAQ page UI and the server FAQPage Schema.org JSON-LD.
 *
 * Updating the questions here updates both at once.
 */

export interface FaqItem {
  q: string
  a: string
}

export const faqs: { ar: FaqItem[]; en: FaqItem[] } = {
  ar: [
    {
      q: 'ما هي منصة نوافذ؟',
      a: 'نوافذ هي منصة B2B متخصصة في السوق اللوجستي السعودي، تتيح للشركات تداول الأصول (الأسطول)، والعقود اللوجستية، وفرص الاستحواذ، والوظائف، والنقاشات المهنية.',
    },
    {
      q: 'كيف أنشر إعلاناً؟',
      a: 'بعد تسجيل الدخول، اضغط على "أضف إعلاناً" واتبع خطوات المعالج البسيط لاختيار القسم وملء التفاصيل ورفع الصور ونشر الإعلان.',
    },
    {
      q: 'ما الفرق بين الإعلان العادي والمميز؟',
      a: 'الإعلانات المميزة تظهر في قسم خاص أعلى صفحة الإعلانات بإطار ذهبي، مما يمنحها ظهوراً أكبر وفرصاً أعلى للتواصل.',
    },
    {
      q: 'كيف أتحقق من هويتي التجارية؟',
      a: 'من صفحة الملف الشخصي، انتقل إلى تبويب "التحقق التجاري" وارفع صورة السجل التجاري. سيراجع فريقنا الطلب خلال 24-48 ساعة.',
    },
    {
      q: 'هل يمكنني حفظ إعلانات أعجبتني؟',
      a: 'نعم، اضغط على أيقونة الإشارة المرجعية في أي بطاقة إعلان لحفظه، ويمكنك مراجعة إعلاناتك المحفوظة من لوحة التحكم.',
    },
    {
      q: 'كيف أتواصل مع صاحب الإعلان؟',
      a: 'يمكنك إرسال رسالة داخلية من صفحة الإعلان أو الضغط على زر واتساب (إذا كان الرقم متاحاً) للتواصل الفوري.',
    },
    {
      q: 'ما هي سياسة الإلغاء واسترداد المبالغ؟',
      a: 'رسوم الإعلانات المميزة غير قابلة للاسترداد بعد النشر. للاستفسار عن حالات استثنائية تواصل معنا عبر support@nwafizlogi.com',
    },
  ],
  en: [
    {
      q: 'What is Nawafez?',
      a: 'Nawafez is a B2B marketplace specialized in the Saudi logistics sector, enabling companies to trade assets (fleet), logistics contracts, M&A opportunities, jobs, and professional discussions.',
    },
    {
      q: 'How do I post a listing?',
      a: 'After logging in, click "Add Listing" and follow the simple wizard to choose the section, fill in details, upload photos, and publish.',
    },
    {
      q: 'What is the difference between regular and featured listings?',
      a: 'Featured listings appear in a special section at the top of the listings page with a golden border, giving them greater visibility and higher chances of engagement.',
    },
    {
      q: 'How do I verify my business identity?',
      a: 'From your profile page, go to the "Business Verification" tab and upload a photo of your commercial registration. Our team will review the request within 24-48 hours.',
    },
    {
      q: 'Can I save listings I like?',
      a: 'Yes, click the bookmark icon on any listing card to save it, and you can review your saved listings from the dashboard.',
    },
    {
      q: 'How do I contact a listing owner?',
      a: 'You can send an internal message from the listing page, or click the WhatsApp button (if a number is provided) for instant contact.',
    },
    {
      q: 'What is the refund policy?',
      a: 'Featured listing fees are non-refundable after publication. For exceptional cases, contact us at support@nwafizlogi.com',
    },
  ],
}
