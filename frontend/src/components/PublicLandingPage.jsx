// frontend/src/components/public/PublicLandingPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  ShoppingCartIcon, 
  UserIcon, 
  HomeIcon,
  MailIcon,
  PhoneIcon,
  ChatIcon,
  XIcon,
  MenuIcon,
  LogoutIcon,
  InboxIcon,
  PaperAirplaneIcon,
  TrashIcon
} from '@heroicons/react/outline';
import api from '../services/api';

const PublicLandingPage = () => {
  // Company Information (easily editable)
  const companyInfo = {
    name: "Your Company Name",
    tagline: "Premium Wholesale Distributor",
    description: "We specialize in high-quality products at competitive wholesale prices. With years of experience in the industry, we provide reliable service and excellent customer support.",
    email: "sales@yourcompany.com",
    phone: "+1 (555) 123-4567",
    whatsapp: "+15551234567",
    address: "123 Business Street, Suite 100\nCity, State 12345",
    businessHours: "Mon-Fri: 9:00 AM - 6:00 PM\nSat: 10:00 AM - 4:00 PM\nSun: Closed",
    socialMedia: {
      facebook: "https://facebook.com/yourcompany",
      instagram: "https://instagram.com/yourcompany",
      linkedin: "https://linkedin.com/company/yourcompany"
    }
  };

  // State Management
  const [activeSection, setActiveSection] = useState('home');
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Payment state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    nameOnCard: ''
  });

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('publicUser');
    const savedCart = localStorage.getItem('publicCart');
    
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error parsing saved user:', e);
      }
    }
    
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Error parsing saved cart:', e);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('publicCart', JSON.stringify(cart));
  }, [cart]);

  // Fetch user messages if logged in
  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]);

  // Auth Functions
  const handleLogin = async () => {
    if (!authForm.email || !authForm.password) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/public/auth/login', {
        email: authForm.email,
        password: authForm.password
      });

      const userData = response.data;
      setUser(userData);
      localStorage.setItem('publicUser', JSON.stringify(userData));
      localStorage.setItem('publicToken', response.data.token);
      
      setShowAuthModal(false);
      setAuthForm({ email: '', password: '', name: '', phone: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!authForm.email || !authForm.password || !authForm.name) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/public/auth/register', {
        email: authForm.email,
        password: authForm.password,
        name: authForm.name,
        phone: authForm.phone || ''
      });

      const userData = response.data;
      setUser(userData);
      localStorage.setItem('publicUser', JSON.stringify(userData));
      localStorage.setItem('publicToken', response.data.token);
      
      setShowAuthModal(false);
      setAuthForm({ email: '', password: '', name: '', phone: '' });
      setAuthMode('login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('publicUser');
    localStorage.removeItem('publicToken');
    setActiveSection('home');
  };

  // Cart Functions
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: product.salePrice || 0,
        image: product.image,
        quantity: 1,
        partNo: product.partNo
      }]);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    
    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartItemsCount = cart.reduce((count, item) => count + item.quantity, 0);

  // Message Functions
  const fetchMessages = async () => {
    try {
      const response = await api.get('/api/public/messages');
      setMessages(response.data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await api.post('/api/public/messages', {
        content: newMessage,
        recipientId: null // Admin recipient
      });

      setMessages([...messages, response.data]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await api.delete(`/api/public/messages/${messageId}`);
      setMessages(messages.filter(msg => msg.id !== messageId));
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  // Payment Functions
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    // Validate payment details
    if (!paymentDetails.cardNumber || !paymentDetails.expiry || !paymentDetails.cvv || !paymentDetails.nameOnCard) {
      alert('Please fill in all payment details');
      return;
    }

    setLoading(true);

    try {
      // In a real implementation, you would integrate with a payment gateway here
      // For now, we'll simulate a successful payment
      
      // Create order
      const orderResponse = await api.post('/api/public/orders', {
        items: cart,
        total: cartTotal,
        paymentMethod: 'credit_card',
        shippingAddress: user.address || ''
      });

      // Clear cart and show success
      setCart([]);
      setShowPaymentModal(false);
      setPaymentDetails({ cardNumber: '', expiry: '', cvv: '', nameOnCard: '' });
      
      alert(`Order #${orderResponse.data.orderNumber} placed successfully! Thank you for your purchase.`);
      
      // Redirect to orders section
      setActiveSection('orders');
    } catch (err) {
      console.error('Payment failed:', err);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // WhatsApp Integration
  const openWhatsApp = () => {
    const message = `Hello ${companyInfo.name}, I'm interested in your products.`;
    const url = `https://wa.me/${companyInfo.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Render Components
  const renderHeader = () => (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo and Company Name */}
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <HomeIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{companyInfo.name}</h1>
              <p className="text-xs text-gray-600">{companyInfo.tagline}</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <button 
              onClick={() => setActiveSection('home')}
              className={`text-sm font-medium ${activeSection === 'home' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}
            >
              Home
            </button>
            <button 
              onClick={() => setActiveSection('products')}
              className={`text-sm font-medium ${activeSection === 'products' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}
            >
              Products
            </button>
            <button 
              onClick={() => setActiveSection('about')}
              className={`text-sm font-medium ${activeSection === 'about' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}
            >
              About Us
            </button>
            <button 
              onClick={() => setActiveSection('contact')}
              className={`text-sm font-medium ${activeSection === 'contact' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}
            >
              Contact
            </button>
            
            {/* User Actions */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowCart(!showCart)}
                className="relative p-2 text-gray-700 hover:text-blue-600"
              >
                <ShoppingCartIcon className="h-6 w-6" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </button>
              
              {user ? (
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setActiveSection('messages')}
                    className="p-2 text-gray-700 hover:text-blue-600 relative"
                  >
                    <InboxIcon className="h-6 w-6" />
                    {messages.filter(m => !m.read).length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {messages.filter(m => !m.read).length}
                      </span>
                    )}
                  </button>
                  <div className="relative group">
                    <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium">{user.name}</span>
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border hidden group-hover:block">
                      <button 
                        onClick={() => setActiveSection('orders')}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                      >
                        My Orders
                      </button>
                      <button 
                        onClick={() => setActiveSection('messages')}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                      >
                        Messages
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <LogoutIcon className="h-4 w-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center"
                >
                  <UserIcon className="h-4 w-4 mr-2" />
                  Login / Register
                </button>
              )}
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 text-gray-700"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden mt-4 pb-4 border-t pt-4">
            <div className="space-y-2">
              <button 
                onClick={() => { setActiveSection('home'); setShowMobileMenu(false); }}
                className={`block w-full text-left px-4 py-2 rounded-lg ${activeSection === 'home' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
              >
                Home
              </button>
              <button 
                onClick={() => { setActiveSection('products'); setShowMobileMenu(false); }}
                className={`block w-full text-left px-4 py-2 rounded-lg ${activeSection === 'products' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
              >
                Products
              </button>
              <button 
                onClick={() => { setActiveSection('about'); setShowMobileMenu(false); }}
                className={`block w-full text-left px-4 py-2 rounded-lg ${activeSection === 'about' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
              >
                About Us
              </button>
              <button 
                onClick={() => { setActiveSection('contact'); setShowMobileMenu(false); }}
                className={`block w-full text-left px-4 py-2 rounded-lg ${activeSection === 'contact' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
              >
                Contact
              </button>
              
              <div className="pt-2 border-t">
                {user ? (
                  <>
                    <button 
                      onClick={() => { setActiveSection('messages'); setShowMobileMenu(false); }}
                      className="block w-full text-left px-4 py-2 text-gray-700"
                    >
                      Messages
                    </button>
                    <button 
                      onClick={() => { setActiveSection('orders'); setShowMobileMenu(false); }}
                      className="block w-full text-left px-4 py-2 text-gray-700"
                    >
                      My Orders
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-red-600"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => { setShowAuthModal(true); setShowMobileMenu(false); }}
                    className="block w-full text-left px-4 py-2 text-blue-600 font-medium"
                  >
                    Login / Register
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );

  const renderHomeSection = () => (
    <section className="py-12">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-white mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to {companyInfo.name}</h1>
          <p className="text-xl mb-6 opacity-90">{companyInfo.description}</p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => setActiveSection('products')}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100"
            >
              Browse Products
            </button>
            <button 
              onClick={openWhatsApp}
              className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 flex items-center"
            >
              <ChatIcon className="h-5 w-5 mr-2" />
              Chat on WhatsApp
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="bg-blue-100 text-blue-600 h-12 w-12 rounded-lg flex items-center justify-center mb-4">
              <ShoppingCartIcon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Easy Ordering</h3>
            <p className="text-gray-600">Browse our catalog and order wholesale products with just a few clicks.</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="bg-green-100 text-green-600 h-12 w-12 rounded-lg flex items-center justify-center mb-4">
              <PhoneIcon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">24/7 Support</h3>
            <p className="text-gray-600">Get assistance anytime through WhatsApp or our messaging system.</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="bg-purple-100 text-purple-600 h-12 w-12 rounded-lg flex items-center justify-center mb-4">
              <MailIcon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Secure Payments</h3>
            <p className="text-gray-600">Safe and secure payment processing for all your wholesale purchases.</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-6">Get Started</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => setActiveSection('products')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View Products
            </button>
            {!user && (
              <button 
                onClick={() => setShowAuthModal(true)}
                className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
              >
                Create Account
              </button>
            )}
            <button 
              onClick={() => setActiveSection('contact')}
              className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </section>
  );

  const renderProductsSection = () => (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Our Products</h2>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Search products..."
              className="border rounded-lg px-4 py-2"
              // Add search functionality here
            />
            <button 
              onClick={() => setShowCart(true)}
              className="relative p-2 text-gray-700 hover:text-blue-600"
            >
              <ShoppingCartIcon className="h-6 w-6" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
        
        {/* Product Catalog will be integrated here */}
        <div className="bg-gray-50 rounded-xl p-4 min-h-[400px]">
          <p className="text-center text-gray-500 py-12">
            Product catalog integration coming soon. You can use your existing GlobalProductCatalog component here.
          </p>
        </div>
      </div>
    </section>
  );

  const renderAboutSection = () => (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">About {companyInfo.name}</h2>
        
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-md p-8 mb-8">
            <h3 className="text-xl font-bold mb-4">Our Story</h3>
            <p className="text-gray-600 mb-4">
              {companyInfo.description}
            </p>
            <p className="text-gray-600">
              We are committed to providing the highest quality products and exceptional customer service. 
              Our team works tirelessly to ensure that every client receives the attention and support they deserve.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Business Hours</h3>
              <pre className="text-gray-600 whitespace-pre-line">{companyInfo.businessHours}</pre>
            </div>
            
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Our Location</h3>
              <p className="text-gray-600 whitespace-pre-line">{companyInfo.address}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const renderContactSection = () => (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">Contact Us</h2>
        
        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Information */}
          <div>
            <div className="bg-white rounded-2xl shadow-md p-8">
              <h3 className="text-xl font-bold mb-6">Get in Touch</h3>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-blue-100 p-3 rounded-lg mr-4">
                    <MailIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Email</h4>
                    <a href={`mailto:${companyInfo.email}`} className="text-blue-600 hover:underline">
                      {companyInfo.email}
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-green-100 p-3 rounded-lg mr-4">
                    <PhoneIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Phone</h4>
                    <a href={`tel:${companyInfo.phone}`} className="text-blue-600 hover:underline">
                      {companyInfo.phone}
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-purple-100 p-3 rounded-lg mr-4">
                    <ChatIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">WhatsApp</h4>
                    <button 
                      onClick={openWhatsApp}
                      className="text-blue-600 hover:underline"
                    >
                      Chat with us on WhatsApp
                    </button>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="mt-8 pt-8 border-t">
                <h4 className="font-semibold mb-4">Follow Us</h4>
                <div className="flex space-x-4">
                  {companyInfo.socialMedia.facebook && (
                    <a 
                      href={companyInfo.socialMedia.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200"
                    >
                      Facebook
                    </a>
                  )}
                  {companyInfo.socialMedia.instagram && (
                    <a 
                      href={companyInfo.socialMedia.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-pink-100 text-pink-600 p-2 rounded-lg hover:bg-pink-200"
                    >
                      Instagram
                    </a>
                  )}
                  {companyInfo.socialMedia.linkedin && (
                    <a 
                      href={companyInfo.socialMedia.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200"
                    >
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <div className="bg-white rounded-2xl shadow-md p-8">
              <h3 className="text-xl font-bold mb-6">Send us a Message</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Your Name</label>
                  <input 
                    type="text" 
                    className="w-full border rounded-lg px-4 py-2"
                    placeholder="Enter your name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Your Email</label>
                  <input 
                    type="email" 
                    className="w-full border rounded-lg px-4 py-2"
                    placeholder="Enter your email"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Subject</label>
                  <input 
                    type="text" 
                    className="w-full border rounded-lg px-4 py-2"
                    placeholder="What is this regarding?"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Message</label>
                  <textarea 
                    rows={4}
                    className="w-full border rounded-lg px-4 py-2"
                    placeholder="Your message here..."
                  />
                </div>
                
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const renderMessagesSection = () => (
    <section className="py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold">Messages</h2>
            <p className="text-gray-600">Communicate with our sales team</p>
          </div>

          {/* Messages List */}
          <div className="h-[500px] overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <InboxIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No messages yet</p>
                <p className="text-sm text-gray-400 mt-2">Start a conversation with our team</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`p-4 rounded-lg ${message.sender === 'user' ? 'bg-blue-50 ml-auto max-w-[80%]' : 'bg-gray-100 max-w-[80%]'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold">
                        {message.sender === 'user' ? 'You' : 'Support Team'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(message.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{message.content}</p>
                    {message.sender === 'user' && (
                      <button
                        onClick={() => deleteMessage(message.id)}
                        className="mt-2 text-red-500 text-sm hover:text-red-700 flex items-center"
                      >
                        <TrashIcon className="h-3 w-3 mr-1" />
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t">
            <div className="flex">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message here..."
                className="flex-1 border rounded-l-lg px-4 py-2"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const renderOrdersSection = () => (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">My Orders</h2>
        
        <div className="bg-white rounded-2xl shadow-md p-6">
          <p className="text-center text-gray-500 py-12">
            Order history will be displayed here. Orders are created after successful payment.
          </p>
        </div>
      </div>
    </section>
  );

  const renderCartSidebar = () => (
    <div className={`fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-2xl transform transition-transform duration-300 ${showCart ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold">Shopping Cart</h3>
          <button 
            onClick={() => setShowCart(false)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Your cart is empty</p>
              <button 
                onClick={() => { setShowCart(false); setActiveSection('products'); }}
                className="mt-4 text-blue-600 hover:text-blue-800"
              >
                Browse Products
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  {item.image && (
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="h-16 w-16 object-cover rounded"
                    />
                  )}
                  <div className="ml-4 flex-1">
                    <h4 className="font-medium text-sm">{item.name}</h4>
                    <p className="text-xs text-gray-500">SKU: {item.partNo}</p>
                    <p className="text-sm font-semibold text-blue-600">${item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center border rounded">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-2 py-1 hover:bg-gray-100"
                      >
                        -
                      </button>
                      <span className="px-2 py-1">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-2 py-1 hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-4 border-t">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold">Total:</span>
              <span className="text-xl font-bold">${cartTotal.toFixed(2)}</span>
            </div>
            <div className="space-y-2">
              <button 
                onClick={handleCheckout}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
              >
                Proceed to Checkout
              </button>
              <button 
                onClick={clearCart}
                className="w-full border border-red-500 text-red-500 py-3 rounded-lg font-semibold hover:bg-red-50"
              >
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderAuthModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">
              {authMode === 'login' ? 'Login' : 'Create Account'}
            </h3>
            <button 
              onClick={() => {
                setShowAuthModal(false);
                setError('');
                setAuthForm({ email: '', password: '', name: '', phone: '' });
              }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  value={authForm.name}
                  onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="Enter your name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                className="w-full border rounded-lg px-4 py-2"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password *</label>
              <input
                type="password"
                value={authForm.password}
                onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                className="w-full border rounded-lg px-4 py-2"
                placeholder="Enter your password"
              />
            </div>

            {authMode === 'register' && (
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={authForm.phone}
                  onChange={(e) => setAuthForm({...authForm, phone: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="Optional"
                />
              </div>
            )}

            <button
              onClick={authMode === 'login' ? handleLogin : handleRegister}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : (authMode === 'login' ? 'Login' : 'Create Account')}
            </button>

            {/* Switch Mode */}
            <div className="text-center pt-4 border-t">
              <p className="text-gray-600">
                {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
                <button
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'register' : 'login');
                    setError('');
                  }}
                  className="text-blue-600 font-medium ml-2 hover:underline"
                >
                  {authMode === 'login' ? 'Sign up' : 'Login'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPaymentModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Payment Details</h3>
            <button 
              onClick={() => setShowPaymentModal(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
              disabled={loading}
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Order Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Order Summary</h4>
            {cart.map((item, index) => (
              <div key={index} className="flex justify-between text-sm mb-1">
                <span>{item.name} x{item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold pt-2 border-t">
              <span>Total:</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Card Number</label>
              <input
                type="text"
                value={paymentDetails.cardNumber}
                onChange={(e) => setPaymentDetails({...paymentDetails, cardNumber: e.target.value})}
                className="w-full border rounded-lg px-4 py-2"
                placeholder="1234 5678 9012 3456"
                maxLength={19}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Expiry Date</label>
                <input
                  type="text"
                  value={paymentDetails.expiry}
                  onChange={(e) => setPaymentDetails({...paymentDetails, expiry: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="MM/YY"
                  maxLength={5}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CVV</label>
                <input
                  type="text"
                  value={paymentDetails.cvv}
                  onChange={(e) => setPaymentDetails({...paymentDetails, cvv: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="123"
                  maxLength={4}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Name on Card</label>
              <input
                type="text"
                value={paymentDetails.nameOnCard}
                onChange={(e) => setPaymentDetails({...paymentDetails, nameOnCard: e.target.value})}
                className="w-full border rounded-lg px-4 py-2"
                placeholder="JOHN DOE"
              />
            </div>

            {/* Security Note */}
            <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">
              <div className="flex items-center">
                <div className="bg-green-100 p-1 rounded mr-2">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Secure payment processed with encryption</span>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : `Pay $${cartTotal.toFixed(2)}`}
            </button>

            {/* Alternative Payment Methods */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Other payment methods</p>
              <div className="flex justify-center space-x-4">
                <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                  PayPal
                </button>
                <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                  Bank Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMainContent = () => {
    switch (activeSection) {
      case 'home':
        return renderHomeSection();
      case 'products':
        return renderProductsSection();
      case 'about':
        return renderAboutSection();
      case 'contact':
        return renderContactSection();
      case 'messages':
        return renderMessagesSection();
      case 'orders':
        return renderOrdersSection();
      default:
        return renderHomeSection();
    }
  };

  const renderFooter = () => (
    <footer className="bg-gray-900 text-white mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center mb-4">
              <div className="bg-blue-600 text-white p-2 rounded-lg mr-2">
                <HomeIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">{companyInfo.name}</h3>
            </div>
            <p className="text-gray-400 mb-4">{companyInfo.description}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => setActiveSection('home')}
                  className="text-gray-400 hover:text-white"
                >
                  Home
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveSection('products')}
                  className="text-gray-400 hover:text-white"
                >
                  Products
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveSection('about')}
                  className="text-gray-400 hover:text-white"
                >
                  About Us
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveSection('contact')}
                  className="text-gray-400 hover:text-white"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-center">
                <MailIcon className="h-4 w-4 mr-2" />
                <a href={`mailto:${companyInfo.email}`} className="hover:text-white">
                  {companyInfo.email}
                </a>
              </li>
              <li className="flex items-center">
                <PhoneIcon className="h-4 w-4 mr-2" />
                <a href={`tel:${companyInfo.phone}`} className="hover:text-white">
                  {companyInfo.phone}
                </a>
              </li>
              <li className="flex items-center">
                <ChatIcon className="h-4 w-4 mr-2" />
                <button onClick={openWhatsApp} className="hover:text-white">
                  WhatsApp Chat
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-400">
          <p>© {new Date().getFullYear()} {companyInfo.name}. All rights reserved.</p>
          <p className="text-sm mt-2">Secure wholesale platform for business customers</p>
        </div>
      </div>
    </footer>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      <main>
        {renderMainContent()}
      </main>
      {renderFooter()}
      
      {/* Modals and Sidebars */}
      {showCart && renderCartSidebar()}
      {showAuthModal && renderAuthModal()}
      {showPaymentModal && renderPaymentModal()}
      
      {/* Cart Button (Mobile) */}
      {cartItemsCount > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 z-40 md:hidden"
        >
          <ShoppingCartIcon className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
            {cartItemsCount}
          </span>
        </button>
      )}
    </div>
  );
};

export default PublicLandingPage;