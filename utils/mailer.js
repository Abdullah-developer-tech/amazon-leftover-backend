const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// 1. Generic Send Email Function
async function sendEmail({ to, subject, text, html }) {
  try {
    const info = await transporter.sendMail({
      from: `"Store Support" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    return info;
  } catch (err) {
    console.error('Failed to send email via transporter:', err.message);
    throw err;
  }
}

// 2. Order Notification Email Function (Updated with Fallbacks)
async function sendOrderEmail(order) {
  const itemsHtml = (order.items || [])
    .map((i) => {
      // Safe fallback check for item name, quantity, and price
      const itemName = i.name || i.product?.name || i.title || 'Product';
      const itemQty = i.quantity || i.qty || 1;
      const itemPrice = i.price || i.product?.price || 0;

      return `<tr>
        <td style="padding:6px 10px;border:1px solid #eee;">${itemName}</td>
        <td style="padding:6px 10px;border:1px solid #eee;">${itemQty}</td>
        <td style="padding:6px 10px;border:1px solid #eee;">Rs. ${itemPrice}</td>
      </tr>`;
    })
    .join('');

  const mapLink = order.location?.lat && order.location?.lng
    ? `https://www.google.com/maps?q=${order.location.lat},${order.location.lng}`
    : null;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
      <h2>New Order Received</h2>
      <p><strong>Customer:</strong> ${order.customerName}</p>
      <p><strong>Phone:</strong> ${order.phone}</p>
      <p><strong>Email:</strong> ${order.email || 'N/A'}</p>
      <p><strong>Address:</strong> ${order.address}</p>
      ${mapLink ? `<p><strong>Live Location:</strong> <a href="${mapLink}" target="_blank">${mapLink}</a></p>` : ''}
      <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
      <table style="border-collapse:collapse;width:100%;margin-top:10px;">
        <thead>
          <tr>
            <th style="padding:6px 10px;border:1px solid #eee;text-align:left;">Item</th>
            <th style="padding:6px 10px;border:1px solid #eee;text-align:left;">Qty</th>
            <th style="padding:6px 10px;border:1px solid #eee;text-align:left;">Price</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <h3>Total: Rs. ${order.totalAmount || 0}</h3>
      <p>Order ID: ${order._id}</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Store Orders" <${process.env.GMAIL_USER}>`,
      to: process.env.ADMIN_NOTIFY_EMAIL,
      subject: `New Order from ${order.customerName} - Rs. ${order.totalAmount || 0}`,
      html,
    });
  } catch (err) {
    console.error('Failed to send order email:', err.message);
  }
}

module.exports = { sendOrderEmail, sendEmail };