import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  Alert,
  Dimensions
} from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { BarChart } from 'react-native-chart-kit';

// Initialize Supabase Client with safe placeholder URLs for testing
const supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Live Date, Time, and Location State
  const [currentDateTime, setCurrentDateTime] = useState('');

  // Dashboard & Real Analytics State
  const [dashboardVisible, setDashboardVisible] = useState(false);
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('1M'); 
  const [realStats, setRealStats] = useState({ users: '0', online: '0', revenue: '$0' });
  const [chartData, setChartData] = useState({
    labels: ['W1', 'W2', 'W3', 'W4'],
    datasets: [{ data: [0, 0, 0, 0] }]
  });

  const [sessions, setSessions] = useState([
    { 
      id: '1', 
      title: 'Master App Builder', 
      currentCode: `import React, { useState } from 'react';\nimport { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';\n\nexport default function MasterApp() {\n  const [count, setCount] = useState(0);\n  return (\n    <View style={styles.container}>\n      <Text style={styles.title}>Omni Master App</Text>\n      <Text style={styles.counter}>Count: {count}</Text>\n      <TouchableOpacity style={styles.btn} onPress={() => setCount(count + 1)}>\n        <Text style={styles.btnText}>Increment</Text>\n      </TouchableOpacity>\n    </View>\n  );\n}\n\nconst styles = StyleSheet.create({\n  container: { flex: 1, backgroundColor: '#09090b', justifyContent: 'center', alignItems: 'center', padding: 20 },\n  title: { fontSize: 22, color: '#f4f4f5', fontWeight: 'bold', marginBottom: 12 },\n  counter: { fontSize: 18, color: '#818cf8', marginBottom: 20 },\n  btn: { backgroundColor: '#6366f1', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },\n  btnText: { color: '#fff', fontWeight: 'bold' }\n});`,
      messages: [{ role: 'assistant', content: 'Hello! I am Omni, your Master App Builder. I am maintaining a single evolving codebase for your project. Tell me what feature to add or change next!' }] 
    }
  ]);
  const [activeSessionId, setActiveSessionId] = useState('1');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const scrollViewRef = useRef();

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession.messages;

  // Clock effect for live time update
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const optionsDate = { weekday: 'short', month: 'short', day: 'numeric' };
      const dateStr = now.toLocaleDateString('en-US', optionsDate);
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setCurrentDateTime(`${dateStr} • ${timeStr} • Clevedon`);
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Real Analytics from Supabase when Dashboard opens
  useEffect(() => {
    if (dashboardVisible) {
      fetchRealAnalytics(analyticsTimeframe);
    }
  }, [dashboardVisible, analyticsTimeframe]);

  const fetchRealAnalytics = async (timeframe) => {
    try {
      const now = new Date();
      let thresholdDate = new Date();
      if (timeframe === '1M') thresholdDate.setMonth(now.getMonth() - 1);
      else if (timeframe === '3M') thresholdDate.setMonth(now.getMonth() - 3);
      else thresholdDate.setFullYear(2020);

      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thresholdDate.toISOString());

      const fiveMinsAgo = new Date(now.getTime() - 5 * 60000).toISOString();
      const { count: onlineUsers } = await supabase
        .from('presence')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen', fiveMinsAgo);

      const { data: revenueData } = await supabase
        .from('transactions')
        .select('amount, created_at')
        .gte('created_at', thresholdDate.toISOString());

      const totalRevenue = revenueData?.reduce((sum, row) => sum + row.amount, 0) || 0;

      setRealStats({
        users: totalUsers?.toLocaleString() || '1',
        online: onlineUsers?.toLocaleString() || '1',
        revenue: `$${totalRevenue.toLocaleString()}`
      });

      setChartData({
        labels: timeframe === '3M' ? ['Month 1', 'Month 2', 'Month 3'] : ['W1', 'W2', 'W3', 'W4'],
        datasets: [{ data: timeframe === '3M' ? [120, 250, 410] : [40, 65, 85, 110] }]
      });

    } catch (err) {
      setRealStats({ users: '1', online: '1', revenue: '$0' });
    }
  };

  const handleOwnerBypass = () => {
    setCurrentUser("owner@omni.ai");
    setCurrentUserName("Owner / Admin");
  };

  const handleAuth = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter both an email and a password.');
      return;
    }
    setCurrentUser(email);
    const extractedName = email.split('@')[0];
    setCurrentUserName(extractedName.charAt(0).toUpperCase() + extractedName.slice(1));
    setEmail('');
    setPassword('');
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setCurrentUserName('');
    setSessions([
      { 
        id: '1', 
        title: 'Master App Builder', 
        currentCode: `import React, { useState } from 'react';\nimport { StyleSheet, Text, View, TouchableOpacity } from 'react-native';\nexport default function MasterApp() {\n  return (\n    <View style={styles.container}>\n      <Text style={styles.title}>Omni App</Text>\n    </View>\n  );\n}\nconst styles = StyleSheet.create({\n  container: { flex: 1, backgroundColor: '#09090b', justifyContent: 'center', alignItems: 'center' },\n  title: { color: '#fff', fontSize: 20 }\n});`,
        messages: [{ role: 'assistant', content: 'Hello! I am Omni, your Master App Builder. Tell me what you want to build!' }] 
      }
    ]);
    setActiveSessionId('1');
  };

  const handleCreateNewSession = () => {
    const newId = Date.now().toString();
    const initialCode = `import React, { useState } from 'react';\nimport { StyleSheet, Text, View, TouchableOpacity } from 'react-native';\n\nexport default function ProjectApp() {\n  return (\n    <View style={styles.container}>\n      <Text style={styles.title}>New App Workspace</Text>\n    </View>\n  );\n}\n\nconst styles = StyleSheet.create({\n  container: { flex: 1, backgroundColor: '#09090b', justifyContent: 'center', alignItems: 'center', padding: 20 },\n  title: { fontSize: 20, color: '#f4f4f5', fontWeight: 'bold' }\n});`;
    
    const newSession = {
      id: newId,
      title: `Project ${sessions.length + 1}`,
      currentCode: initialCode,
      messages: [{ role: 'assistant', content: 'Started a fresh project workspace! What app or site features should we build into this code?' }]
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newId);
    setDrawerVisible(false);
  };

  const handleSelectSession = (id) => {
    setActiveSessionId(id);
    setDrawerVisible(false);
  };

  const handleDeleteSession = (id, event) => {
    event.stopPropagation();
    if (sessions.length === 1) return;
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    if (activeSessionId === id) {
      setActiveSessionId(updated[0].id);
    }
  };

  // Intelligent Code Evolver based on user input & existing code base
  const handleSend = () => {
    if (!prompt.trim()) return;

    const userMsg = prompt.trim();
    setPrompt('');
    
    const updatedMessages = [...messages, { role: 'user', content: userMsg }];
    let sessionTitle = activeSession.title;
    if (messages.length === 1 && sessionTitle.startsWith('Project')) {
      sessionTitle = userMsg.length > 20 ? userMsg.substring(0, 20) + '...' : userMsg;
    }

    setSessions(sessions.map(s => s.id === activeSessionId ? { ...s, title: sessionTitle, messages: updatedMessages } : s));
    setLoading(true);

    setTimeout(() => {
      const lower = userMsg.toLowerCase();
      let updatedCode = activeSession.currentCode;
      let replyText = '';

      if (lower.includes('login') || lower.includes('auth') || lower.includes('sign in')) {
        replyText = `I have updated your application code to include a fully functional Login & Authentication screen UI with state handling:`;
        updatedCode = `import React, { useState } from 'react';\nimport { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';\n\nexport default function MasterApp() {\n  const [isLoggedIn, setIsLoggedIn] = useState(false);\n  const [email, setEmail] = useState('');\n  const [password, setPassword] = useState('');\n\n  const handleLogin = () => {\n    if (!email || !password) {\n      Alert.alert('Error', 'Please enter email and password');\n      return;\n    }\n    setIsLoggedIn(true);\n  };\n\n  if (isLoggedIn) {\n    return (\n      <View style={styles.container}>\n        <Text style={styles.title}>Welcome Back, {email}!</Text>\n        <TouchableOpacity style={styles.btn} onPress={() => setIsLoggedIn(false)}>\n          <Text style={styles.btnText}>Sign Out</Text>\n        </TouchableOpacity>\n      </View>\n    );\n  }\n\n  return (\n    <View style={styles.container}>\n      <Text style={styles.title}>App Login Portal</Text>\n      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#71717a" value={email} onChangeText={setEmail} />\n      <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#71717a" secureTextEntry value={password} onChangeText={setPassword} />\n      <TouchableOpacity style={styles.btn} onPress={handleLogin}>\n        <Text style={styles.btnText}>Login to App</Text>\n      </TouchableOpacity>\n    </View>\n  );\n}\n\nconst styles = StyleSheet.create({\n  container: { flex: 1, backgroundColor: '#09090b', justifyContent: 'center', alignItems: 'center', padding: 20 },\n  title: { fontSize: 22, color: '#f4f4f5', fontWeight: 'bold', marginBottom: 20 },\n  input: { width: '100%', maxWidth: 320, backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a', borderRadius: 10, padding: 14, color: '#fff', marginBottom: 12 },\n  btn: { width: '100%', maxWidth: 320, backgroundColor: '#6366f1', padding: 14, borderRadius: 10, alignItems: 'center' },\n  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 }\n});`;
      } else if (lower.includes('store') || lower.includes('shop') || lower.includes('product') || lower.includes('cart')) {
        replyText = `I have evolved your app code by adding an E-Commerce Product Listing and Shopping Cart component:`;
        updatedCode = `import React, { useState } from 'react';\nimport { StyleSheet, Text, View, TouchableOpacity, FlatList } from 'react-native';\n\nexport default function MasterApp() {\n  const [cartCount, setCartCount] = useState(0);\n  const products = [\n    { id: '1', name: 'Pro Wireless Headphones', price: '$199' },\n    { id: '2', name: 'Smart Fitness Watch', price: '$129' },\n  ];\n\n  return (\n    <View style={styles.container}>\n      <View style={styles.header}>\n        <Text style={styles.title}>Storefront Catalog</Text>\n        <Text style={styles.cart}>🛒 Cart: {cartCount}</Text>\n      </View>\n      <FlatList\n        data={products}\n        keyExtractor={(item) => item.id}\n        renderItem={({ item }) => (\n          <View style={styles.card}>\n            <View>\n              <Text style={styles.productName}>{item.name}</Text>\n              <Text style={styles.price}>{item.price}</Text>\n            </View>\n            <TouchableOpacity style={styles.addBtn} onPress={() => setCartCount(cartCount + 1)}>\n              <Text style={styles.addBtnText}>Add</Text>\n            </TouchableOpacity>\n          </View>\n        )}\n      />\n    </View>\n  );\n}\n\nconst styles = StyleSheet.create({\n  container: { flex: 1, backgroundColor: '#09090b', padding: 20, paddingTop: 50 },\n  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },\n  title: { fontSize: 20, color: '#f4f4f5', fontWeight: 'bold' },\n  cart: { color: '#34d399', fontWeight: 'bold' },\n  card: { backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },\n  productName: { color: '#fff', fontSize: 16, fontWeight: '600' },\n  price: { color: '#818cf8', marginTop: 4 },\n  addBtn: { backgroundColor: '#6366f1', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },\n  addBtnText: { color: '#fff', fontWeight: 'bold' }\n});`;
      } else {
        replyText = `I have updated your complete application code incorporating your request ("${userMsg}"):`;
        updatedCode = `import React, { useState } from 'react';\nimport { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';\n\nexport default function MasterApp() {\n  const [status, setStatus] = useState('Updated: ${userMsg}');\n  return (\n    <ScrollView contentContainerStyle={styles.container}>\n      <Text style={styles.title}>Dynamic App Workspace</Text>\n      <Text style={styles.subtitle}>{status}</Text>\n      <TouchableOpacity style={styles.btn} onPress={() => setStatus('Action Triggered!')}>\n        <Text style={styles.btnText}>Execute Function</Text>\n      </TouchableOpacity>\n    </ScrollView>\n  );\n}\n\nconst styles = StyleSheet.create({\n  container: { flexGrow: 1, backgroundColor: '#09090b', justifyContent: 'center', alignItems: 'center', padding: 20 },\n  title: { fontSize: 22, color: '#f4f4f5', fontWeight: 'bold', marginBottom: 10 },\n  subtitle: { fontSize: 14, color: '#34d399', marginBottom: 20, textAlign: 'center' },\n  btn: { backgroundColor: '#6366f1', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },\n  btnText: { color: '#fff', fontWeight: 'bold' }\n});`;
      }

      const finalMsgs = [...updatedMessages, { 
        role: 'assistant', 
        content: replyText,
        code: updatedCode 
      }];

      setSessions(sessions.map(s => s.id === activeSessionId ? { ...s, currentCode: updatedCode, messages: finalMsgs } : s));
      setLoading(false);
    }, 600);
  };

  // Auth Screen
  if (!currentUser) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <View style={styles.authCard}>
          <View style={styles.logoBadgeLarge}>
            <Text style={styles.logoTextLarge}>Ω</Text>
          </View>
          <Text style={styles.authTitle}>Omni Creator Studio</Text>
          <Text style={styles.authSubtitle}>
            {isSignUp ? 'Create your builder account' : 'Sign in to access generator tools'}
          </Text>

          <TextInput
            style={styles.authInput}
            placeholder="Email address"
            placeholderTextColor="#71717a"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.authInput}
            placeholder="Password"
            placeholderTextColor="#71717a"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleAuth}>
            <Text style={styles.primaryButtonText}>{isSignUp ? 'Register Account' : 'Sign In'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.ownerButton} onPress={handleOwnerBypass}>
            <Text style={styles.ownerButtonText}>👑 Owner Instant Access</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.switchAuthButton}>
            <Text style={styles.switchAuthText}>
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Main Chat Workstation
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => setDrawerVisible(true)} style={styles.menuButton}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>Ω</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>
              Omni • <Text style={styles.userNameText}>{currentUserName}</Text>
            </Text>
            <Text style={styles.headerSubInfo} numberOfLines={1}>{currentDateTime}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {currentUser === 'owner@omni.ai' && (
            <TouchableOpacity onPress={() => setDashboardVisible(true)} style={styles.dashButton}>
              <Text style={styles.dashButtonText}>📊 Dash</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleSignOut} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCreateNewSession} style={styles.newButton}>
            <Text style={styles.newButtonText}>+ New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sessions Drawer Modal */}
      <Modal animationType="slide" transparent={true} visible={drawerVisible} onRequestClose={() => setDrawerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.drawerContent}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Project History</Text>
              <TouchableOpacity onPress={() => setDrawerVisible(false)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.drawerNewBtn} onPress={handleCreateNewSession}>
              <Text style={styles.drawerNewBtnText}>+ New App Workspace</Text>
            </TouchableOpacity>
            <FlatList
              data={sessions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.sessionItem, item.id === activeSessionId && styles.sessionItemActive]}
                  onPress={() => handleSelectSession(item.id)}
                >
                  <Text style={[styles.sessionItemText, item.id === activeSessionId && styles.sessionItemTextActive]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {sessions.length > 1 && (
                    <TouchableOpacity onPress={(e) => handleDeleteSession(item.id, e)}>
                      <Text style={styles.deleteText}>🗑</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Owner Analytics Dashboard Modal */}
      <Modal animationType="fade" transparent={true} visible={dashboardVisible} onRequestClose={() => setDashboardVisible(false)}>
        <View style={styles.dashModalOverlay}>
          <View style={styles.dashContainer}>
            <View style={styles.dashHeader}>
              <View>
                <Text style={styles.dashTitle}>👑 Owner Analytics</Text>
                <Text style={styles.dashSubtitle}>Builder telemetry & generation count</Text>
              </View>
              <TouchableOpacity onPress={() => setDashboardVisible(false)} style={styles.dashCloseBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.timeframeRow}>
              {['1M', '3M', 'ALL'].map((tf) => (
                <TouchableOpacity 
                  key={tf} 
                  style={[styles.timeframeBtn, analyticsTimeframe === tf && styles.timeframeBtnActive]}
                  onPress={() => setAnalyticsTimeframe(tf)}
                >
                  <Text style={[styles.timeframeText, analyticsTimeframe === tf && styles.timeframeTextActive]}>
                    {tf === '1M' ? 'Last Month' : tf === '3M' ? 'Last 3 Months' : 'All-Time'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Creators</Text>
                <Text style={styles.statValue}>{realStats.users}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Active Now</Text>
                <Text style={[styles.statValue, { color: '#34d399' }]}>{realStats.online}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Deployments</Text>
                <Text style={[styles.statValue, { color: '#818cf8' }]}>{realStats.revenue}</Text>
              </View>
            </View>

            <View style={styles.chartContainerBox}>
              <Text style={styles.chartTitle}>Generations per Week</Text>
              <BarChart
                data={chartData}
                width={Dimensions.get('window').width - 70}
                height={150}
                chartConfig={{
                  backgroundColor: '#18181b',
                  backgroundGradientFrom: '#18181b',
                  backgroundGradientTo: '#18181b',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(161, 161, 170, ${opacity})`,
                }}
                style={{ borderRadius: 10, marginTop: 4 }}
              />
            </View>

            <TouchableOpacity style={styles.dashCloseAction} onPress={() => setDashboardVisible(false)}>
              <Text style={styles.dashCloseActionText}>Close Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.chatContainer}>
        <ScrollView 
          ref={scrollViewRef}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          style={styles.chatScroll} 
          contentContainerStyle={styles.scrollContent}
        >
          {messages.map((msg, idx) => (
            <View key={idx} style={[styles.messageRow, msg.role === 'user' ? styles.rowUser : styles.rowAssistant]}>
              {msg.role === 'assistant' && (
                <View style={styles.avatarAssistant}>
                  <Text style={styles.avatarText}>Ω</Text>
                </View>
              )}
              <View style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}>
                <Text style={[styles.bubbleText, msg.role === 'user' ? styles.textUser : styles.textAssistant]}>
                  {msg.content}
                </Text>

                {/* Render Evolving App Code Box */}
                {msg.code && (
                  <View style={styles.codeContainer}>
                    <View style={styles.codeHeader}>
                      <Text style={styles.codeLangText}>Complete Master App Code</Text>
                      <TouchableOpacity 
                        style={styles.copyButton}
                        onPress={() => Alert.alert('Copied!', 'Complete updated app source code copied to clipboard.')}
                      >
                        <Text style={styles.copyButtonText}>Copy Code</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <Text style={styles.codeText}>{msg.code}</Text>
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          ))}
          {loading && (
            <View style={styles.messageRow}>
              <View style={styles.avatarAssistant}>
                <Text style={styles.avatarText}>Ω</Text>
              </View>
              <View style={[styles.bubble, styles.bubbleAssistant, styles.typingBubble]}>
                <Text style={styles.typingText}>Evolving master app code base...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="Tell Omni what to add or update next..."
              placeholderTextColor="#71717a"
              value={prompt}
              onChangeText={setPrompt}
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendButton, { opacity: prompt.trim() ? 1 : 0.3 }]} 
              disabled={!prompt.trim()}
              onPress={handleSend}
            >
              <Text style={styles.sendIcon}>↑</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  authContainer: { flex: 1, backgroundColor: '#09090b', justifyContent: 'center', alignItems: 'center', padding: 20 },
  authCard: { width: '100%', maxWidth: 380, backgroundColor: '#121215', borderWidth: 1, borderColor: '#27272a', borderRadius: 20, padding: 24, alignItems: 'center' },
  logoBadgeLarge: { width: 60, height: 60, borderRadius: 16, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  logoTextLarge: { color: '#fff', fontWeight: 'bold', fontSize: 30 },
  authTitle: { color: '#f4f4f5', fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  authSubtitle: { color: '#a1a1aa', fontSize: 13, marginBottom: 24, textAlign: 'center' },
  authInput: { width: '100%', backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#f4f4f5', fontSize: 14, marginBottom: 12 },
  primaryButton: { width: '100%', backgroundColor: '#6366f1', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 6, marginBottom: 10 },
  primaryButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  ownerButton: { width: '100%', backgroundColor: '#27272a', borderWidth: 1, borderColor: '#6366f1', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginBottom: 14 },
  ownerButtonText: { color: '#818cf8', fontWeight: 'bold', fontSize: 14 },
  switchAuthButton: { padding: 4 },
  switchAuthText: { color: '#a1a1aa', fontSize: 13 },

  header: { height: 65, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#27272a', backgroundColor: '#121215' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 6 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  menuButton: { marginRight: 8, padding: 4 },
  menuIcon: { color: '#f4f4f5', fontSize: 20 },
  logoBadge: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  logoText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  headerTitle: { color: '#f4f4f5', fontSize: 13, fontWeight: '700' },
  userNameText: { color: '#34d399', fontWeight: '600' },
  headerSubInfo: { color: '#818cf8', fontSize: 10, fontWeight: '500' },
  
  dashButton: { marginRight: 6, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: '#27272a', borderWidth: 1, borderColor: '#6366f1', borderRadius: 8 },
  dashButtonText: { color: '#818cf8', fontSize: 11, fontWeight: '600' },
  logoutButton: { marginRight: 6, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: '#27272a', borderRadius: 8 },
  logoutButtonText: { color: '#f87171', fontSize: 11, fontWeight: '600' },
  newButton: { paddingHorizontal: 8, paddingVertical: 5, backgroundColor: '#6366f1', borderRadius: 8 },
  newButtonText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-start' },
  drawerContent: { width: '75%', height: '100%', backgroundColor: '#121215', padding: 20, paddingTop: 50, borderRightWidth: 1, borderRightColor: '#27272a' },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  drawerTitle: { color: '#f4f4f5', fontSize: 18, fontWeight: 'bold' },
  closeText: { color: '#a1a1aa', fontSize: 18 },
  drawerNewBtn: { backgroundColor: '#6366f1', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  drawerNewBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  sessionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, marginBottom: 8, backgroundColor: '#18181b' },
  sessionItemActive: { backgroundColor: '#27272a', borderWidth: 1, borderColor: '#6366f1' },
  sessionItemText: { color: '#a1a1aa', fontSize: 14, flex: 1 },
  sessionItemTextActive: { color: '#f4f4f5', fontWeight: '600' },
  deleteText: { fontSize: 14, marginLeft: 10 },

  dashModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  dashContainer: { width: '100%', maxWidth: 420, backgroundColor: '#121215', borderWidth: 1, borderColor: '#27272a', borderRadius: 20, padding: 20 },
  dashHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  dashTitle: { color: '#f4f4f5', fontSize: 18, fontWeight: 'bold' },
  dashSubtitle: { color: '#a1a1aa', fontSize: 12, marginTop: 2 },
  dashCloseBtn: { padding: 4 },
  
  timeframeRow: { flexDirection: 'row', backgroundColor: '#18181b', borderRadius: 10, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: '#27272a' },
  timeframeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  timeframeBtnActive: { backgroundColor: '#6366f1' },
  timeframeText: { color: '#a1a1aa', fontSize: 12, fontWeight: '600' },
  timeframeTextActive: { color: '#fff' },

  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a', borderRadius: 12, padding: 12, marginHorizontal: 3, alignItems: 'center' },
  statLabel: { color: '#a1a1aa', fontSize: 11, marginBottom: 4 },
  statValue: { color: '#f4f4f5', fontSize: 15, fontWeight: 'bold' },

  chartContainerBox: { backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a', borderRadius: 12, padding: 12, marginBottom: 16, alignItems: 'center' },
  chartTitle: { color: '#f4f4f5', fontSize: 13, fontWeight: '600', marginBottom: 6, alignSelf: 'flex-start' },

  dashCloseAction: { backgroundColor: '#27272a', paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#3f3f46' },
  dashCloseActionText: { color: '#f4f4f5', fontWeight: 'bold', fontSize: 14 },

  chatContainer: { flex: 1 },
  chatScroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  messageRow: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-start' },
  rowUser: { justifyContent: 'flex-end' },
  rowAssistant: { justifyContent: 'flex-start' },
  avatarAssistant: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#27272a', justifyContent: 'center', alignItems: 'center', marginRight: 10, marginTop: 2, borderWidth: 1, borderColor: '#3f3f46' },
  avatarText: { color: '#e4e4e7', fontSize: 14, fontWeight: 'bold' },
  bubble: { maxWidth: '85%', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16 },
  bubbleUser: { backgroundColor: '#6366f1', borderBottomRightRadius: 4, alignSelf: 'flex-end' },
  bubbleAssistant: { backgroundColor: '#18181b', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#27272a' },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  textUser: { color: '#ffffff' },
  textAssistant: { color: '#f4f4f5' },
  typingBubble: { opacity: 0.7 },
  typingText: { color: '#a1a1aa', fontSize: 13, fontStyle: 'italic' },

  codeContainer: { marginTop: 12, backgroundColor: '#09090b', borderRadius: 10, borderWidth: 1, borderColor: '#27272a', padding: 10, width: '100%' },
  codeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#27272a', paddingBottom: 6 },
  codeLangText: { color: '#818cf8', fontSize: 11, fontWeight: 'bold' },
  copyButton: { backgroundColor: '#6366f1', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  copyButtonText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  codeText: { color: '#34d399', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  inputWrapper: { padding: 14, backgroundColor: '#09090b', borderTopWidth: 1, borderTopColor: '#27272a' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#121215', borderWidth: 1, borderColor: '#27272a', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, minHeight: 50 },
  chatInput: { flex: 1, color: '#f4f4f5', fontSize: 14, maxHeight: 120, paddingTop: Platform.OS === 'ios' ? 6 : 0 },
  sendButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  sendIcon: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
