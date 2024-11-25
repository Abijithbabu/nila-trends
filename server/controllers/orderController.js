const Order = require('../models/order')
const User = require('../models/user');
const Product = require('../models/product');
const Address = require('../models/address');   
const nodemailer = require('nodemailer');      
const moment = require('moment-timezone');
const dotenv = require('dotenv');
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_AUTH_USER,
    pass: process.env.EMAIL_AUTH_PASS,
  },
});  

const getOrders = async (req, res) => {
  try {
    const data = await Order.find().sort({ createdAt: -1 });
    res.status(200).json({ data })
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err?.message ?? 'Something went wrong' })
  }
};
const getClientOrders = async (req, res) => {
  console.log('getClientOrders');
  
  try {
    const { _id } = req?.decoded
    const { status } = req.query;
    console.log('status',status);
    const data = await Order.find({ userId: _id ,status }).populate('products.item.product_id')
    .populate('address')
    .sort({ createdAt: -1 });   
    console.log('order data',data);
    res.status(200).json({ data })
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err?.message ?? 'Something went wrong' })
  }
};

const getAdminOrders = async (req, res) => {
  try {
    const { page = 1, perPage = 10, sortBy = 'createdAt', order = 'desc', search = '' } = req.query;

    const query = {};

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(perPage, 10),
      sort: { [sortBy]: order === 'desc' ? -1 : 1 },
      populate: [
        { path: 'userId', select: 'username email' },
        { path: 'address', select: 'fullname address_line_1 address_line_2 emirate area code mobile' },
        { path: 'products.item.product_id', select: 'name category price image' },
      ],
    };

    const result = await Order.paginate(query, options);

    let filteredData = result.docs;

    if (search) {
      const searchLowerCase = search.toLowerCase();
      filteredData = filteredData.filter(order =>
        (order.userId.username && order.userId.username.toLowerCase().includes(searchLowerCase)) ||
        (order.userId.email && order.userId.email.toLowerCase().includes(searchLowerCase))
      );
    }


    res.status(200).json({
      data: filteredData,
      totalDocs: filteredData.length,
      totalResults: result.totalDocs,
      page: result.page,
      totalPages: result.totalPages,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err?.message ?? 'Something went wrong' });
  }
};


const getUserOrders = async (req, res) => {
  try {
    const { _id } = req?.decoded
    const data = await Order.find({ userId: _id }).populate('products.item.product_id') // Populate all fields in products
      .populate('address')
      .sort({ createdAt: -1 });
    res.status(200).json({ data })
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err?.message ?? 'Something went wrong' })
  }
};

const getOrderById = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    console.log(orderId);
    const data = await Order.findById(orderId)
      .populate('products.item.product_id')

    // console.log(data);
    res.status(200).json({ data });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err?.message ?? 'Something went wrong' });
  }
};


const createOrder = async (req, res) => {
  const { _id } = req?.decoded

  const { payment_mode, amount, address, products, couponId,delivery_days } = req?.body
  console.log('payment_mode, amount, address, products,couponId,delivery_days', payment_mode, amount, address, products, couponId,delivery_days);

  try {
    const data = await Order.create({ userId: _id, payment_mode, amount, address, products,delivery_days })

    const user = await User.findById(_id);
    user.cart.item = [];
    user.cart.totalPrice = 0;
    user.orderCount +=1

    if (couponId) {
      if (user.coupons.includes(couponId)) {
        return res.status(400).json({ message: "Coupon already used" });
      } else {
        user.coupons.push(couponId);
      }
    }
    await user.save();

    for (const item of products.item) {
      const product = await Product.findById(item.product_id);

      if (product) {
        if (product.sizes && product.sizes.length > 0) {
          const sizeToUpdate = product.sizes.find(size => size.sizes === item.size);

          if (sizeToUpdate && sizeToUpdate.quantity >= item.qty) {
            sizeToUpdate.quantity -= item.qty;
          } else {
            return res.status(400).json({ message: `Insufficient stock for size: ${item.size}` });
          }
        } else {
          if (product.stock >= item.qty) {
            product.stock -= item.qty;
          } else {
            return res.status(400).json({ message: "Insufficient stock for the product" });
          }
        }

        await product.save();
      }

    }


    const productDetails = await Order.findById(data._id) 
            .populate({
                path: 'products.item.product_id', 
                model: 'Product'                    
            })

    const orderNumber = productDetails._id;
    const orderTime = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
    const adminEmail = process.env.EMAIL_ADMIN;

    const emailSubject = `Your Nila Trends Order ID is:${orderNumber}`;

    const productItems =  productDetails.products.item.map(item => `
      <tr>
        <td>${item.product_id.name}</td>
        <td>${item.qty}</td>
        <td>${item.size}</td>
        <td>₹${item.price}</td>
      </tr>
    `).join('');

    const customerEmailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h1 style="color: #4CAF50;">Order Received</h1>
        <p>Dear ${productDetails?.address?.fullname},</p>
        <p>Thank you for your order. </p>
        <p>Here are your order details:</p>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 8px; border: 1px solid #ddd;">Product Name</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Quantity</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Size</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${productItems}
          </tbody>
        </table>
        <p><strong>Total Amount:</strong> ₹${productDetails?.amount}</p>
        <p><strong>Order Date and Time (IST):</strong> ${orderTime}</p>   
        <p>We will notify you once your order is shipped.</p>
        <p>Thank you for shopping with us!</p>
        <p>Best Regards,<br>Melon Magnets</p>
      </div>
    `;

    const internalEmailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h1 style="color: #4CAF50;">Order Received</h1>
        <p>New order has been placed by <b>${productDetails?.address?.fullname}</b> at ${orderTime}.</p>
        <p><strong>Email:</strong> ${productDetails?.address?.email}</p>
        <p><strong>Phone:</strong> ${productDetails?.address?.mobile}</p>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 8px; border: 1px solid #ddd;">Product Name</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Quantity</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Size</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${productItems}
          </tbody>
        </table>
        <p><strong>Total Amount:</strong> ₹${productDetails?.amount}</p>
        <p>For more details, <a href="https://admin.nilaatrends.com//#/orders/editOrder/${productDetails?._id}" target="_blank">Click here</a>.</p>
      </div>
    `;

console.log('productDetails?.address?.email',productDetails?.address?.email);

    await transporter.sendMail({
      from: process.env.EMAIL_AUTH_USER,
      to: productDetails?.address?.email,
      subject: emailSubject,
      html: customerEmailHtml,
    });


    await transporter.sendMail({
      from: process.env.EMAIL_AUTH_USER,
      to: adminEmail,
      subject: emailSubject,
      html: internalEmailHtml,
    });





    res.status(201).json({ user,orderId:orderNumber, message: 'Order placed successfully' });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err?.message ?? 'Something went wrong' })
  }
}

const updateOrder = async (req, res) => {
  const { _id, status } = req?.body
  try {
    const data = await Order.updateOne({ _id },
      { $set: { status } })
    res.status(201).json({ data, message: 'Order updated successfully' });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err?.message ?? 'Something went wrong' })
  }
}
const getReviewOrders = async (req, res) => {
  try {
    const { userId, productId } = req.params;
    console.log(' userId, productId', userId, productId);

    const orders = await Order.find({ userId, 'products.item.product_id': productId });

    res.status(200).json({ canWriteReview: orders.length > 0 });
  } catch (err) {
    res.status(500).json({ success: false, err: err.message });
  }
};

const updateOrderStatus = async (req, res) => {
  const { orderId, newStatus } = req.body;
  console.log(orderId, newStatus);

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = newStatus;
    await order.save();

    res.status(200).json({ message: 'Order status updated successfully' });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err?.message ?? 'Something went wrong' });
  }
};
module.exports = {
  getOrders,
  getUserOrders,
  createOrder,
  updateOrder,
  getOrderById,
  getReviewOrders,
  getAdminOrders,
  updateOrderStatus,
  getClientOrders
}
