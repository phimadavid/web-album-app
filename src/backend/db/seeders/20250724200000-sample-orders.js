"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // First, get existing users to create orders for them
    const users = await queryInterface.sequelize.query(
      "SELECT id FROM Users LIMIT 5",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (users.length === 0) {
      console.log(
        "No users found to create orders for. Skipping order seeding."
      );
      return;
    }

    const sampleOrders = [
      {
        id: "order-001-ai-art-uuid",
        userId: users[0].id,
        orderNumber: "ORD-2024-001",
        status: "pending",
        items: JSON.stringify([
          {
            albumName: "AI Generated Art Collection",
            bookFormat: "8x10 Hardcover",
            coverType: "Premium",
            quantity: 1,
            unitPrice: 49.99,
            totalPrice: 49.99,
          },
        ]),
        subtotal: 49.99,
        shippingTotal: 9.99,
        tax: 0.0,
        total: 59.98,
        customerInfo: JSON.stringify({
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: "+1234567890",
        }),
        shippingAddress: JSON.stringify({
          street: "123 Main St",
          city: "New York",
          state: "NY",
          zipCode: "10001",
          country: "USA",
        }),
        paymentMethod: "Credit Card",
        paymentStatus: "paid",
        notes: "Customer requested expedited processing",
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "order-002-album-uuid",
        userId: users[Math.min(1, users.length - 1)].id,
        orderNumber: "ORD-2024-002",
        status: "processing",
        items: JSON.stringify([
          {
            albumName: "Family Vacation Album",
            bookFormat: "12x12 Premium",
            coverType: "Leather",
            quantity: 2,
            unitPrice: 79.99,
            totalPrice: 159.98,
          },
        ]),
        subtotal: 159.98,
        shippingTotal: 14.99,
        tax: 0.0,
        total: 174.97,
        customerInfo: JSON.stringify({
          firstName: "Jane",
          lastName: "Smith",
          email: "jane@example.com",
          phone: "+1987654321",
        }),
        shippingAddress: JSON.stringify({
          street: "456 Oak Ave",
          city: "Los Angeles",
          state: "CA",
          zipCode: "90210",
          country: "USA",
        }),
        paymentMethod: "PayPal",
        paymentStatus: "paid",
        notes: null,
        estimatedDelivery: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        id: "order-003-mixed-uuid",
        userId: users[Math.min(2, users.length - 1)].id,
        orderNumber: "ORD-2024-003",
        status: "shipped",
        items: JSON.stringify([
          {
            albumName: "AI Art Portfolio",
            bookFormat: "11x8.5 Softcover",
            coverType: "Matte",
            quantity: 1,
            unitPrice: 29.99,
            totalPrice: 29.99,
          },
          {
            albumName: "Wedding Album",
            bookFormat: "10x10 Hardcover",
            coverType: "Glossy",
            quantity: 1,
            unitPrice: 89.99,
            totalPrice: 89.99,
          },
        ]),
        subtotal: 119.98,
        shippingTotal: 12.99,
        tax: 0.0,
        total: 132.97,
        customerInfo: JSON.stringify({
          firstName: "Mike",
          lastName: "Johnson",
          email: "mike@example.com",
          phone: "+1555123456",
        }),
        shippingAddress: JSON.stringify({
          street: "789 Pine St",
          city: "Chicago",
          state: "IL",
          zipCode: "60601",
          country: "USA",
        }),
        paymentMethod: "Credit Card",
        paymentStatus: "paid",
        notes: "Mixed order with AI art and traditional album",
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        trackingNumber: "TRK123456789",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        id: "order-004-delivered-uuid",
        userId: users[Math.min(3, users.length - 1)].id,
        orderNumber: "ORD-2024-004",
        status: "delivered",
        items: JSON.stringify([
          {
            albumName: "Generated Landscape Art",
            bookFormat: "8x8 Square",
            coverType: "Standard",
            quantity: 3,
            unitPrice: 24.99,
            totalPrice: 74.97,
          },
        ]),
        subtotal: 74.97,
        shippingTotal: 7.99,
        tax: 0.0,
        total: 82.96,
        customerInfo: JSON.stringify({
          firstName: "Sarah",
          lastName: "Wilson",
          email: "sarah@example.com",
          phone: "+1444987654",
        }),
        shippingAddress: JSON.stringify({
          street: "321 Elm Dr",
          city: "Miami",
          state: "FL",
          zipCode: "33101",
          country: "USA",
        }),
        paymentMethod: "Debit Card",
        paymentStatus: "paid",
        notes: "Customer very satisfied with AI generated art quality",
        estimatedDelivery: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        trackingNumber: "TRK987654321",
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: "order-005-cancelled-uuid",
        userId: users[Math.min(4, users.length - 1)].id,
        orderNumber: "ORD-2024-005",
        status: "cancelled",
        items: JSON.stringify([
          {
            albumName: "Baby Photo Album",
            bookFormat: "6x6 Mini",
            coverType: "Soft",
            quantity: 1,
            unitPrice: 19.99,
            totalPrice: 19.99,
          },
        ]),
        subtotal: 19.99,
        shippingTotal: 5.99,
        tax: 0.0,
        total: 25.98,
        customerInfo: JSON.stringify({
          firstName: "David",
          lastName: "Brown",
          email: "david@example.com",
          phone: "+1333555777",
        }),
        shippingAddress: JSON.stringify({
          street: "654 Maple Ln",
          city: "Seattle",
          state: "WA",
          zipCode: "98101",
          country: "USA",
        }),
        paymentMethod: "Credit Card",
        paymentStatus: "refunded",
        notes: "Order cancelled due to customer request",
        estimatedDelivery: null,
        trackingNumber: null,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ];

    await queryInterface.bulkInsert("Orders", sampleOrders, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Orders", null, {});
  },
};
