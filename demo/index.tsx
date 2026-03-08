import React, { useState, useEffect, useMemo } from 'react';
import {
    CheckCircle2, Circle, LayoutDashboard, Users, Activity,
    ListTodo, LogOut, Menu, X, Plus, Trash2, TrendingUp,
    Clock, Target, Briefcase, ChevronRight, Bell, Search,
    Loader2, Edit, Save, XCircle
} from 'lucide-react';

// แก้ไขปัญหา 'tailwind is not defined' ในโหมด Preview
var tailwind = window.tailwind || { config: {} };

// ==========================================
// 1. CONSTANTS & SEED DATA
// ==========================================
const WORKSPACES = ['Frontend Unit', 'Backend Unit', 'Marketing Team', 'Management', 'Personal'];
const CATEGORIES = ['Production', 'Marketing', 'Admin'];

const SEED_USERS = [
    { id: '1', name: 'Admin System', email: 'admin@app.com', password: 'password', role: 'admin', lastActive: '2026-03-07' },
    { id: '2', name: 'สมชาย นักพัฒนา', email: 'somchai@app.com', password: 'password', role: 'user', lastActive: '2026-03-06' },
    { id: '3', name: 'สมหญิง การตลาด', email: 'somying@app.com', password: 'password', role: 'user', lastActive: '2026-03-01' },
];

const SEED_TODOS = [
    { id: '101', userId: '1', title: 'วางโครงสร้าง Database Schema', category: 'Production', priority: 5, completed: true, date: '2026-03-01', workspace: 'Backend Unit' },
    { id: '102', userId: '1', title: 'ประชุมสรุป Requirement', category: 'Admin', priority: 4, completed: true, date: '2026-03-02', workspace: 'Management' },
    { id: '103', userId: '2', title: 'สร้างหน้า Login / Register', category: 'Production', priority: 5, completed: false, date: '2026-03-07', workspace: 'Frontend Unit' },
    { id: '104', userId: '2', title: 'แก้บั๊ก Responsive มือถือ', category: 'Production', priority: 3, completed: true, date: '2026-03-05', workspace: 'Frontend Unit' },
    { id: '105', userId: '3', title: 'เขียนแคปชั่นโฆษณาแคมเปญใหม่', category: 'Marketing', priority: 4, completed: false, date: '2026-03-08', workspace: 'Marketing Team' },
    { id: '106', userId: '3', title: 'ยิงแอด Facebook', category: 'Marketing', priority: 5, completed: false, date: '2026-03-09', workspace: 'Marketing Team' },
];

// ==========================================
// 2. CENTRAL DATA STORE (Full CRUD + Local Storage)
// ==========================================
function useAppStore() {
    const [isReady, setIsReady] = useState(false);
    const [users, setUsers] = useState([]);
    const [todos, setTodos] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const loadData = () => {
            const storedUsers = localStorage.getItem('todo_app_users');
            const storedTodos = localStorage.getItem('todo_app_todos');
            const storedAuth = localStorage.getItem('todo_app_auth');

            if (storedUsers) setUsers(JSON.parse(storedUsers));
            else { setUsers(SEED_USERS); localStorage.setItem('todo_app_users', JSON.stringify(SEED_USERS)); }

            if (storedTodos) setTodos(JSON.parse(storedTodos));
            else { setTodos(SEED_TODOS); localStorage.setItem('todo_app_todos', JSON.stringify(SEED_TODOS)); }

            if (storedAuth) setCurrentUser(JSON.parse(storedAuth));

            setTimeout(() => setIsReady(true), 400); // Fake delay
        };
        loadData();
    }, []);

    // --- ACTIONS ---

    // Auth
    const login = (email, password) => {
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            const updatedUser = { ...user, lastActive: new Date().toISOString().split('T')[0] };
            const newUsers = users.map(u => u.id === user.id ? updatedUser : u);
            setUsers(newUsers); localStorage.setItem('todo_app_users', JSON.stringify(newUsers));
            setCurrentUser(updatedUser); localStorage.setItem('todo_app_auth', JSON.stringify(updatedUser));
            return { success: true, user: updatedUser };
        }
        return { success: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
    };

    const logout = () => { setCurrentUser(null); localStorage.removeItem('todo_app_auth'); };

    const register = (name, email, password) => {
        if (users.some(u => u.email === email)) return { success: false, error: 'อีเมลนี้มีผู้ใช้งานแล้ว' };
        const newUser = { id: Date.now().toString(), name, email, password, role: 'user', lastActive: new Date().toISOString().split('T')[0] };
        const newUsers = [...users, newUser];
        setUsers(newUsers); localStorage.setItem('todo_app_users', JSON.stringify(newUsers));
        return { success: true };
    };

    // Todo CRUD
    const addTodo = (todo) => {
        const newTodos = [todo, ...todos];
        setTodos(newTodos); localStorage.setItem('todo_app_todos', JSON.stringify(newTodos));
    };

    const updateTodo = (id, updatedData) => {
        const newTodos = todos.map(t => t.id === id ? { ...t, ...updatedData } : t);
        setTodos(newTodos); localStorage.setItem('todo_app_todos', JSON.stringify(newTodos));
    };

    const toggleTodo = (id) => {
        const newTodos = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
        setTodos(newTodos); localStorage.setItem('todo_app_todos', JSON.stringify(newTodos));
    };

    const deleteTodo = (id) => {
        const newTodos = todos.filter(t => t.id !== id);
        setTodos(newTodos); localStorage.setItem('todo_app_todos', JSON.stringify(newTodos));
    };

    // User Admin CRUD
    const adminAddUser = (name, email, password, role) => {
        if (users.some(u => u.email === email)) return { success: false, error: 'อีเมลนี้มีในระบบแล้ว' };
        const newUser = { id: Date.now().toString(), name, email, password, role, lastActive: 'ยังไม่เคยใช้งาน' };
        const newUsers = [...users, newUser];
        setUsers(newUsers); localStorage.setItem('todo_app_users', JSON.stringify(newUsers));
        return { success: true };
    };

    const toggleUserRole = (id) => {
        const newUsers = users.map(u => u.id === id ? { ...u, role: u.role === 'admin' ? 'user' : 'admin' } : u);
        setUsers(newUsers); localStorage.setItem('todo_app_users', JSON.stringify(newUsers));
    };

    const deleteUser = (id) => {
        const newUsers = users.filter(u => u.id !== id);
        setUsers(newUsers); localStorage.setItem('todo_app_users', JSON.stringify(newUsers));

        // CASCADE DELETE: ลบงานที่เกี่ยวกับ user นี้
        const newTodos = todos.filter(t => t.userId !== id);
        setTodos(newTodos); localStorage.setItem('todo_app_todos', JSON.stringify(newTodos));
    };

    return {
        isReady,
        data: { users, todos, currentUser },
        actions: { login, logout, register, addTodo, updateTodo, toggleTodo, deleteTodo, adminAddUser, toggleUserRole, deleteUser }
    };
}


// ==========================================
// 3. LAYOUT COMPONENTS
// ==========================================
function MobileHeader({ setIsOpen, currentPath, user }) {
    const getTitle = () => {
        if (currentPath.includes('/todos')) return 'งานของคุณ';
        if (currentPath.includes('/overview')) return 'ภาพรวมระบบ';
        if (currentPath.includes('/customers')) return 'ลูกค้า (RFM)';
        if (currentPath.includes('/branches')) return 'ประสิทธิภาพทีม';
        if (currentPath.includes('/users')) return 'จัดการบัญชี';
        return 'TodoFlow';
    };

    return (
        <header className="md:hidden bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3">
                <button onClick={() => setIsOpen(true)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <Menu size={24} />
                </button>
                <h1 className="text-lg font-bold text-slate-800">{getTitle()}</h1>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm border border-blue-200 shadow-sm">
                {user?.name?.charAt(0) || 'U'}
            </div>
        </header>
    );
}

function DesktopHeader({ currentPath, user }) {
    const getTitle = () => {
        if (currentPath.includes('/todos')) return 'จัดการงานของคุณ';
        if (currentPath.includes('/overview')) return 'ภาพรวมระบบทั้งหมด';
        if (currentPath.includes('/customers')) return 'วิเคราะห์พฤติกรรมผู้ใช้ (RFM)';
        if (currentPath.includes('/branches')) return 'ประสิทธิภาพแต่ละทีม (Workspaces)';
        if (currentPath.includes('/users')) return 'จัดการบัญชีผู้ใช้';
        return 'Dashboard';
    };

    return (
        <header className="bg-white/50 backdrop-blur-sm border-b border-slate-200/60 px-8 py-5 items-center justify-between sticky top-0 z-10 hidden md:flex">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{getTitle()}</h1>
                <p className="text-sm text-slate-500 mt-1">ยินดีต้อนรับกลับมา, {user?.name?.split(' ')[0] || 'User'} 👋</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="hidden lg:flex items-center bg-white border border-slate-200 rounded-full px-4 py-2 shadow-sm">
                    <Search size={16} className="text-slate-400 mr-2" />
                    <input type="text" placeholder="ค้นหา..." className="bg-transparent text-sm outline-none w-48 text-slate-700" />
                </div>
                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full border-2 border-white"></span>
                </button>
            </div>
        </header>
    );
}

function Sidebar({ user, currentPath, navigate, actions, isOpen, setIsOpen }) {
    const navItems = [
        { name: 'จัดการงาน (Todos)', path: '/dashboard/todos', icon: ListTodo, roles: ['admin', 'user'] },
        { name: 'ภาพรวมระบบ (Overview)', path: '/dashboard/overview', icon: LayoutDashboard, roles: ['admin'] },
        { name: 'พฤติกรรมผู้ใช้ (RFM)', path: '/dashboard/customers', icon: Activity, roles: ['admin'] },
        { name: 'ประสิทธิภาพทีม (Branch)', path: '/dashboard/branches', icon: TrendingUp, roles: ['admin'] },
        { name: 'จัดการผู้ใช้ (Users)', path: '/admin/users', icon: Users, roles: ['admin'] },
    ];

    const allowedItems = navItems.filter(item => item.roles.includes(user?.role));

    const handleLogout = () => { actions.logout(); navigate('/login'); };

    return (
        <>
            {isOpen && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity" onClick={() => setIsOpen(false)} />}
            <div className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-[#0f172a] text-slate-300 shadow-2xl transform transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col border-r border-slate-800 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} md:relative`}>
                <div className="px-6 py-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30"><CheckCircle2 className="text-white" size={20} /></div>
                        <span className="text-white font-bold text-xl tracking-tight">Todo<span className="text-amber-400">Flow</span></span>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"><X size={20} /></button>
                </div>

                <div className="px-4 mb-8">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900 border border-slate-700/50 shadow-inner relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center font-bold text-white shadow-sm">{user?.name?.charAt(0) || 'U'}</div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5"><span className={`w-1.5 h-1.5 rounded-full ${user?.role === 'admin' ? 'bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.5)]' : 'bg-blue-400'}`}></span><p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{user?.role}</p></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Menu</div>
                <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                    {allowedItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPath === item.path;
                        return (
                            <button key={item.path} onClick={() => navigate(item.path)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-blue-600/10 text-blue-400 font-semibold' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                                <div className={`flex items-center justify-center transition-colors ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`}><Icon size={20} strokeWidth={isActive ? 2.5 : 2} /></div>
                                {item.name}
                                {isActive && <div className="ml-auto w-1.5 h-6 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 mt-auto border-t border-slate-800/80">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors font-medium group"><LogOut size={20} className="group-hover:-translate-x-1 transition-transform" /> ออกจากระบบ</button>
                </div>
            </div>
        </>
    );
}

// ==========================================
// 4. AUTH SCREENS
// ==========================================
function LoginScreen({ navigate, actions }) {
    const [email, setEmail] = useState('admin@app.com');
    const [password, setPassword] = useState('password');
    const [error, setError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        const result = actions.login(email, password);
        if (result.success) navigate(result.user.role === 'admin' ? '/dashboard/overview' : '/dashboard/todos');
        else setError(result.error);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-10 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20 shadow-xl rotate-3"><CheckCircle2 size={40} className="text-white" /></div>
                    <h2 className="text-3xl font-bold text-white mb-2">ยินดีต้อนรับ</h2><p className="text-blue-100 text-sm">เข้าสู่ระบบเพื่อจัดการงานของคุณ</p>
                </div>
                <div className="p-8">
                    <form onSubmit={handleLogin} className="space-y-5">
                        {error && <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 font-medium">{error}</div>}
                        <div><label className="block text-sm font-semibold text-slate-700 mb-2">อีเมล</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white" /></div>
                        <div><label className="block text-sm font-semibold text-slate-700 mb-2">รหัสผ่าน</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white" /></div>
                        <button type="submit" className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 mt-2 active:scale-95">เข้าสู่ระบบ <ChevronRight size={20} /></button>
                    </form>
                    <div className="mt-8 text-center text-sm text-slate-500">ยังไม่มีบัญชีใช่ไหม? <button onClick={() => navigate('/register')} className="text-amber-600 font-bold hover:underline">สร้างบัญชีใหม่</button></div>
                </div>
            </div>
        </div>
    );
}

function RegisterScreen({ navigate, actions }) {
    const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState('');

    const handleRegister = (e) => {
        e.preventDefault();
        if (!name || !email || !password) return setError('กรอกข้อมูลให้ครบทุกช่อง');
        const result = actions.register(name, email, password);
        if (result.success) { alert('สมัครสมาชิกสำเร็จ! กรุณาล็อกอิน'); navigate('/login'); }
        else setError(result.error);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-slate-100 p-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">สร้างบัญชีใหม่</h2>
                <p className="text-slate-500 text-center mb-8 text-sm">เริ่มต้นจัดการงานกับ TodoFlow ได้ฟรี</p>
                <form onSubmit={handleRegister} className="space-y-4">
                    {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 font-medium text-center">{error}</div>}
                    <div><label className="block text-sm font-semibold text-slate-700 mb-1">ชื่อ-นามสกุล</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none" required /></div>
                    <div><label className="block text-sm font-semibold text-slate-700 mb-1">อีเมล</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none" required /></div>
                    <div><label className="block text-sm font-semibold text-slate-700 mb-1">รหัสผ่าน</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none" required /></div>
                    <button type="submit" className="w-full bg-amber-500 text-white py-3.5 rounded-xl font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/30 mt-4">สมัครสมาชิกเลย</button>
                </form>
                <div className="mt-8 text-center text-sm text-slate-500">มีบัญชีอยู่แล้ว? <button onClick={() => navigate('/login')} className="text-blue-600 font-bold hover:underline">เข้าสู่ระบบ</button></div>
            </div>
        </div>
    );
}

// ==========================================
// 5. APP SCREENS (FULL CRUD)
// ==========================================

// --- TODOS SCREEN (Create, Read, Update, Delete) ---
function TodosScreen({ user, todos, actions }) {
    const [filter, setFilter] = useState('all');

    // Create / Edit State
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({ title: '', category: CATEGORIES[0], priority: 3, workspace: WORKSPACES[0] });

    // Reset form helper
    const resetForm = () => {
        setFormData({ title: '', category: CATEGORIES[0], priority: 3, workspace: WORKSPACES[0] });
        setIsAdding(false);
        setEditingId(null);
    };

    const handleStartEdit = (todo) => {
        setIsAdding(false);
        setEditingId(todo.id);
        setFormData({ title: todo.title, category: todo.category, priority: todo.priority, workspace: todo.workspace });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title.trim()) return;

        if (editingId) {
            actions.updateTodo(editingId, { ...formData, priority: parseInt(formData.priority) });
        } else {
            actions.addTodo({
                id: Date.now().toString(),
                userId: user.id,
                completed: false,
                date: new Date().toISOString().split('T')[0],
                ...formData,
                priority: parseInt(formData.priority)
            });
        }
        resetForm();
    };

    const myTodos = user.role === 'admin' ? todos : todos.filter(t => t.userId === user.id);
    const filteredTodos = myTodos.filter(t => {
        if (filter === 'active') return !t.completed;
        if (filter === 'completed') return t.completed;
        return true;
    });

    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col relative">
            {/* Top Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sticky top-0 bg-slate-50/90 backdrop-blur-md z-10 py-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:py-0">
                <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 w-full sm:w-auto">
                    {['all', 'active', 'completed'].map(f => (
                        <button key={f} onClick={() => { setFilter(f); resetForm(); }} className={`flex-1 sm:flex-none px-4 py-2 sm:py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${filter === f ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                            {f === 'all' ? 'งานทั้งหมด' : f === 'active' ? 'กำลังทำ' : 'เสร็จแล้ว'}
                        </button>
                    ))}
                </div>
                {!isAdding && !editingId && (
                    <button onClick={() => setIsAdding(true)} className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md shadow-blue-500/20 active:scale-95">
                        <Plus size={18} /> เพิ่มงานใหม่
                    </button>
                )}
            </div>

            {/* Add / Edit Form */}
            {(isAdding || editingId) && (
                <div className="bg-white p-5 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 mb-6 relative overflow-hidden animate-in slide-in-from-top-4">
                    <div className={`absolute top-0 left-0 w-1 h-full ${editingId ? 'bg-blue-500' : 'bg-amber-400'}`}></div>
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            {editingId ? <><Edit size={18} className="text-blue-500" /> แก้ไขงาน</> : <><Plus size={18} className="text-amber-500" /> สร้างงานใหม่</>}
                        </h3>
                        <button onClick={resetForm} className="text-slate-400 hover:bg-slate-100 p-1 rounded-lg"><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input type="text" placeholder="คุณต้องทำอะไรบ้าง?" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} autoFocus className="w-full text-lg sm:text-xl font-medium border-b-2 border-slate-100 py-2 outline-none focus:border-blue-500 bg-transparent placeholder-slate-300 transition-colors" />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">หมวดหมู่</label>
                                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="text-sm border-2 border-slate-100 rounded-xl p-2.5 bg-white outline-none focus:border-blue-500">
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">ทีม / Workspace</label>
                                <select value={formData.workspace} onChange={e => setFormData({ ...formData, workspace: e.target.value })} className="text-sm border-2 border-slate-100 rounded-xl p-2.5 bg-white outline-none focus:border-blue-500">
                                    {WORKSPACES.map(w => <option key={w} value={w}>{w}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1 justify-center">
                                <label className="text-xs font-semibold text-slate-500 uppercase">ความสำคัญ: <span className="text-amber-600 font-bold ml-1">P{formData.priority}</span></label>
                                <div className="flex items-center h-full px-2">
                                    <input type="range" min="1" max="5" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} className="w-full accent-amber-500" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-50 mt-4">
                            <button type="button" onClick={resetForm} className="px-5 py-2.5 text-slate-500 hover:bg-slate-100 rounded-xl text-sm font-semibold transition-colors">ยกเลิก</button>
                            <button type="submit" className={`px-5 py-2.5 text-white rounded-xl text-sm font-semibold shadow-md transition-all active:scale-95 flex items-center gap-2 ${editingId ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'}`}>
                                {editingId ? <><Save size={16} /> บันทึกการแก้ไข</> : 'เพิ่มงาน'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Todo List */}
            <div className="space-y-3 sm:space-y-4 pb-20">
                {filteredTodos.length === 0 ? (
                    <div className="text-center py-16 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={40} className="text-slate-300" /></div>
                        <h3 className="text-xl font-bold text-slate-700">ไม่มีงานที่ต้องทำ</h3>
                        <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">ยอดเยี่ยมมาก! คุณเคลียร์งานหมดแล้ว หรือกดเพิ่มงานใหม่เพื่อเริ่มต้น</p>
                    </div>
                ) : (
                    filteredTodos.map(todo => (
                        <div key={todo.id} className={`group flex items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-white rounded-2xl shadow-sm transition-all duration-200 border border-transparent hover:shadow-md ${todo.completed ? 'opacity-70 bg-slate-50' : 'hover:border-blue-100'} ${editingId === todo.id ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}>
                            <button onClick={() => actions.toggleTodo(todo.id)} className="mt-1 sm:mt-0 flex-shrink-0 transition-transform active:scale-90 p-1">
                                {todo.completed ? <CheckCircle2 className="text-green-500 fill-green-50" size={28} /> : <Circle className="text-slate-300 hover:text-blue-500" size={28} />}
                            </button>

                            <div className="flex-1 min-w-0">
                                <p className={`text-base sm:text-lg font-semibold truncate transition-all duration-200 ${todo.completed ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-800'}`}>{todo.title}</p>
                                <div className="flex items-center flex-wrap gap-2 mt-2">
                                    <span className={`text-[11px] sm:text-xs px-2.5 py-1 rounded-md font-semibold ${todo.category === 'Production' ? 'bg-blue-50 text-blue-700 border border-blue-100' : todo.category === 'Marketing' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>{todo.category}</span>
                                    <span className="text-[11px] sm:text-xs px-2.5 py-1 rounded-md bg-slate-50 text-slate-600 border border-slate-200 flex items-center gap-1"><Briefcase size={12} /> {todo.workspace}</span>
                                    {todo.priority >= 4 && <span className="text-[11px] sm:text-xs px-2.5 py-1 rounded-md bg-red-50 text-red-600 border border-red-100 font-bold flex items-center gap-1">⚡ P{todo.priority}</span>}
                                    {user.role === 'admin' && <span className="text-[11px] sm:text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">UID: {todo.userId}</span>}
                                </div>
                            </div>

                            <div className="sm:opacity-0 group-hover:opacity-100 transition-opacity flex items-center h-full gap-1">
                                <button onClick={() => handleStartEdit(todo)} className="p-2 sm:p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"><Edit size={18} /></button>
                                <button onClick={() => confirm('ลบงานนี้ใช่ไหม?') && actions.deleteTodo(todo.id)} className="p-2 sm:p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {!isAdding && !editingId && (
                <button onClick={() => setIsAdding(true)} className="md:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-600/40 flex items-center justify-center active:scale-95 transition-transform">
                    <Plus size={28} />
                </button>
            )}
        </div>
    );
}

// --- ADMIN USER MANAGEMENT SCREEN (Create, Read, Update Role, Delete) ---
function UserManagementScreen({ users, actions }) {
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user' });
    const [error, setError] = useState('');

    const resetForm = () => {
        setFormData({ name: '', email: '', password: '', role: 'user' });
        setError('');
        setIsAdding(false);
    };

    const handleCreateUser = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.password) return setError('กรุณากรอกข้อมูลให้ครบ');

        const res = actions.adminAddUser(formData.name, formData.email, formData.password, formData.role);
        if (res.success) resetForm();
        else setError(res.error);
    };

    const handleDelete = (id, role) => {
        if (role === 'admin' && users.filter(u => u.role === 'admin').length === 1) {
            return alert('ไม่สามารถลบ Admin คนสุดท้ายได้');
        }
        if (confirm('ยืนยันการลบผู้ใช้งานและงานทั้งหมดที่เกี่ยวข้อง? (ลบแล้วกู้คืนไม่ได้)')) {
            actions.deleteUser(id);
        }
    };

    return (
        <div className="space-y-6 md:space-y-8 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <div><h2 className="text-2xl font-bold text-slate-800">จัดการบัญชีผู้ใช้</h2></div>
                {!isAdding && (
                    <button onClick={() => setIsAdding(true)} className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-colors">
                        <Plus size={18} className="inline mr-2" /> สร้างผู้ใช้ใหม่
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-200 mb-6 relative animate-in zoom-in-95">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800">สร้างบัญชีผู้ใช้ใหม่</h3>
                        <button onClick={resetForm} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-lg"><X size={20} /></button>
                    </div>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{error}</div>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">ชื่อ-นามสกุล</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">อีเมล</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">รหัสผ่านชั่วคราว</label>
                                <input type="text" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="เช่น password123" required />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">สิทธิ์การใช้งาน (Role)</label>
                                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                    <option value="user">User (ทั่วไป)</option>
                                    <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end pt-4 border-t border-slate-50 mt-4">
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md">บันทึกข้อมูล</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {users.map(u => (
                    <div key={u.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:border-blue-200 transition-colors">
                        {u.role === 'admin' && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-100 to-transparent rounded-tr-3xl rounded-bl-full z-0"></div>}
                        <div className="flex items-start gap-4 mb-6 relative z-10"><div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-xl text-slate-500 font-bold border border-slate-100 shadow-sm">{u.name.charAt(0)}</div><div className="flex-1 min-w-0"><h3 className="font-bold text-lg text-slate-800 truncate">{u.name}</h3><p className="text-sm text-slate-500 truncate">{u.email}</p></div></div>
                        <div className="flex justify-between items-center pt-4 border-t border-slate-50 relative z-10">
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${u.role === 'admin' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{u.role === 'admin' ? '⭐ Admin' : 'User'}</span>
                            <div className="flex gap-2">
                                <button onClick={() => actions.toggleUserRole(u.id)} className="text-xs font-semibold px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">สลับ Role</button>
                                {u.email !== 'admin@app.com' && <button onClick={() => handleDelete(u.id, u.role)} className="text-red-500 hover:bg-red-50 p-2 rounded-xl border border-transparent hover:border-red-100 transition-colors"><Trash2 size={18} /></button>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- DASHBOARD COMPONENTS ---
function OverviewScreen({ todos }) {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const backlog = total - completed;
    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

    const categories = todos.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + 1; return acc; }, {});
    const getPercent = (cat) => total === 0 ? 0 : ((categories[cat] || 0) / total) * 100;

    const pieGradient = `conic-gradient(#2563eb 0% ${getPercent('Production')}%, #f59e0b ${getPercent('Production')}% ${getPercent('Production') + getPercent('Marketing')}%, #94a3b8 ${getPercent('Production') + getPercent('Marketing')}% 100%)`;

    return (
        <div className="space-y-6 md:space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
                <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100"><span className="text-slate-500 text-xs md:text-sm font-semibold mb-1 block">งานทั้งหมด</span><div className="text-2xl md:text-4xl font-bold text-slate-800">{total}</div></div>
                <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-green-500"><span className="text-slate-500 text-xs md:text-sm font-semibold mb-1 block">สำเร็จแล้ว</span><div className="text-2xl md:text-4xl font-bold text-slate-800">{completed}</div></div>
                <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-amber-500"><span className="text-slate-500 text-xs md:text-sm font-semibold mb-1 block">ค้างอยู่ (Backlog)</span><div className="text-2xl md:text-4xl font-bold text-slate-800">{backlog}</div></div>
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 md:p-6 rounded-2xl shadow-md shadow-blue-600/20 text-white col-span-2 md:col-span-1">
                    <span className="text-blue-100 text-xs md:text-sm font-semibold mb-1 block">อัตราความสำเร็จ</span>
                    <div className="text-3xl md:text-4xl font-bold">{completionRate}%</div>
                    <div className="w-full bg-blue-900/50 rounded-full h-2 mt-3 overflow-hidden"><div className="bg-amber-400 h-full rounded-full" style={{ width: `${completionRate}%` }}></div></div>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 w-full text-left">สัดส่วนตามประเภทงาน</h3>
                    <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full mb-8 shadow-inner" style={{ background: pieGradient }}>
                        <div className="absolute inset-4 md:inset-6 bg-white rounded-full flex items-center justify-center shadow-sm"><div className="text-center"><div className="text-3xl font-bold text-slate-800">{total}</div><div className="text-xs text-slate-400 font-semibold uppercase">Total</div></div></div>
                    </div>
                    <div className="w-full space-y-3">
                        {CATEGORIES.map(cat => (
                            <div key={cat} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                                <span className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                                    <div className={`w-3 h-3 rounded-full ${cat === 'Production' ? 'bg-blue-600' : cat === 'Marketing' ? 'bg-amber-500' : 'bg-slate-400'}`}></div> {cat}
                                </span>
                                <span className="font-bold text-slate-800">{categories[cat] || 0}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 lg:col-span-2">
                    <h3 className="text-lg font-bold text-slate-800 mb-8">จำลองแนวโน้ม (สัปดาห์นี้)</h3>
                    <div className="h-64 flex items-end justify-between gap-1 sm:gap-4 pb-8 border-b border-slate-100 relative mt-4">
                        <div className="absolute left-0 bottom-8 w-full h-[calc(100%-2rem)] flex flex-col justify-between text-xs text-slate-300 pointer-events-none z-0">
                            <div className="border-t border-slate-100 w-full h-0"></div><div className="border-t border-slate-100 w-full h-0"></div><div className="border-t border-slate-100 w-full h-0"></div>
                        </div>
                        {[40, 60, 45, 80, 50, 90, 30].map((h, i) => (
                            <div key={i} className="w-full flex flex-col items-center gap-3 relative z-10 group h-full justify-end">
                                <div className="w-full max-w-[48px] bg-blue-50 rounded-t-lg relative h-full flex items-end">
                                    <div className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-500 group-hover:from-blue-700 group-hover:to-blue-500 shadow-sm" style={{ height: `${h}%` }}>
                                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded font-bold transition-opacity">{h}</div>
                                    </div>
                                </div>
                                <span className="text-xs sm:text-sm text-slate-500 font-semibold">{['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'][i]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function CustomerAnalysisScreen({ users, todos }) {
    const rfmData = users.map(u => {
        const userTodos = todos.filter(t => t.userId === u.id);
        const completed = userTodos.filter(t => t.completed).length;
        // Calculate Score from priority of completed tasks (more realistic)
        const score = userTodos.filter(t => t.completed).reduce((sum, t) => sum + (t.priority * 10), 0);

        let segment = 'Newbie', color = 'bg-slate-100 text-slate-600 border-slate-200';
        if (completed > 2 && score > 50) { segment = 'Power User'; color = 'bg-green-50 text-green-700 border-green-200'; }
        else if (completed > 0) { segment = 'Active'; color = 'bg-blue-50 text-blue-700 border-blue-200'; }
        else if (userTodos.length > 2) { segment = 'At Risk (ดองงาน)'; color = 'bg-red-50 text-red-700 border-red-200'; }

        return { ...u, completed, total: userTodos.length, score, segment, color };
    }).sort((a, b) => b.score - a.score);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 md:mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl w-fit"><Target size={32} /></div>
                <div><h2 className="text-2xl font-bold text-slate-800">RFM Customer Segment</h2></div>
            </div>

            <div className="md:hidden space-y-4">
                {rfmData.map(u => (
                    <div key={u.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">{u.name.charAt(0)}</div>
                                <div><h3 className="font-bold text-slate-800">{u.name}</h3><p className="text-xs text-slate-400">{u.email}</p></div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${u.color}`}>{u.segment}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-50 p-3 rounded-xl">
                            <div><p className="text-xs text-slate-500 font-medium mb-1">งานที่ทำสำเร็จ</p><p className="font-bold text-slate-800">{u.completed} /{u.total}</p></div>
                            <div><p className="text-xs text-slate-500 font-medium mb-1">คะแนน (Impact)</p><p className="font-bold text-amber-600">{u.score} pts</p></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead><tr className="bg-slate-50/50 border-b border-slate-200"><th className="p-5 text-sm font-semibold text-slate-600">พนักงาน</th><th className="p-5 text-sm font-semibold text-slate-600">ความถี่ (Freq)</th><th className="p-5 text-sm font-semibold text-slate-600">คะแนน (Impact)</th><th className="p-5 text-sm font-semibold text-slate-600">Segment</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {rfmData.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center font-bold text-blue-700">{u.name.charAt(0)}</div><div><div className="font-bold text-slate-800">{u.name}</div><div className="text-xs text-slate-400">{u.email}</div></div></div></td>
                                <td className="p-5"><div className="flex items-center gap-3"><div className="w-24 h-2.5 bg-slate-100 rounded-full overflow-hidden"><div className="bg-blue-500 h-full rounded-full" style={{ width: `${u.total === 0 ? 0 : (u.completed / u.total) * 100}%` }}></div></div><span className="text-sm font-bold text-slate-700">{u.completed}/{u.total}</span></div></td>
                                <td className="p-5 font-bold text-amber-600 text-lg">{u.score}</td>
                                <td className="p-5"><span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${u.color}`}>{u.segment}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function BranchPerformanceScreen({ todos }) {
    const branchData = WORKSPACES.map(ws => {
        const wsTodos = todos.filter(t => t.workspace === ws);
        return { name: ws, total: wsTodos.length, completed: wsTodos.filter(t => t.completed).length };
    }).sort((a, b) => b.total - a.total);

    const days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์'], times = ['เช้า', 'บ่าย', 'เย็น', 'ดึก'];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 md:mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl w-fit"><Briefcase size={32} /></div>
                <div><h2 className="text-2xl font-bold text-slate-800">Branch Performance</h2></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><TrendingUp size={20} className="text-blue-500" /> ปริมาณงานแยกตามแผนก</h3>
                    <div className="space-y-5">
                        {branchData.map((b, i) => (
                            <div key={b.name} className="flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-bold text-slate-400 text-sm border border-slate-100">{i + 1}</div>
                                <div className="flex-1"><div className="flex justify-between mb-2"><span className="font-semibold text-slate-700">{b.name}</span><span className="text-sm font-bold text-slate-600">{b.completed} /{b.total}</span></div><div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden"><div className="bg-gradient-to-r from-blue-500 to-blue-400 h-full rounded-full transition-all duration-500" style={{ width: `${b.total === 0 ? 0 : (b.completed / b.total) * 100}%` }}></div></div></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Clock size={20} className="text-amber-500" /> ช่วงเวลาทำงาน (Heatmap)</h3>
                    <div className="overflow-x-auto flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="min-w-[300px]">
                            <div className="grid grid-cols-5 gap-2 mb-2"><div className="col-span-1"></div>{times.map(t => <div key={t} className="text-xs font-bold text-slate-400 text-center uppercase tracking-wider">{t}</div>)}</div>
                            {days.map((day) => (
                                <div key={day} className="grid grid-cols-5 gap-2 mb-2 items-center">
                                    <div className="text-sm font-semibold text-slate-600 col-span-1">{day}</div>
                                    {times.map((time) => {
                                        const intensity = Math.max(10, Math.floor(Math.random() * 100));
                                        let color = 'bg-blue-100 text-transparent';
                                        if (intensity > 80) color = 'bg-blue-600 text-white';
                                        else if (intensity > 50) color = 'bg-blue-400 text-white';
                                        else if (intensity > 25) color = 'bg-blue-200 text-slate-600';
                                        return <div key={time} className={`h-10 rounded-xl col-span-1 flex items-center justify-center text-xs font-bold ${color}`}>{intensity > 50 ? intensity : ''}</div>
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


// ==========================================
// 6. MAIN APP CONFIGURATION
// ==========================================
export default function App() {
    const store = useAppStore();
    const { isReady, data: { users, todos, currentUser }, actions } = store;

    const [currentPath, setCurrentPath] = useState('/login');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navigate = (path) => { setCurrentPath(path); setIsMobileMenuOpen(false); };

    useEffect(() => {
        if (isReady) {
            if (currentUser && (currentPath === '/login' || currentPath === '/register')) {
                navigate(currentUser.role === 'admin' ? '/dashboard/overview' : '/dashboard/todos');
            } else if (!currentUser && !currentPath.includes('/register')) {
                navigate('/login');
            }
        }
    }, [isReady, currentUser]);

    if (!isReady) return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
            <h2 className="text-lg font-bold text-slate-700">กำลังโหลดระบบ...</h2>
        </div>
    );

    if (!currentUser) {
        if (currentPath === '/register') return <RegisterScreen navigate={navigate} actions={actions} />;
        return <LoginScreen navigate={navigate} actions={actions} />;
    }

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
            <Sidebar user={currentUser} currentPath={currentPath} navigate={navigate} actions={actions} isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <MobileHeader setIsOpen={setIsMobileMenuOpen} currentPath={currentPath} user={currentUser} />
                <DesktopHeader currentPath={currentPath} user={currentUser} />

                <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:px-12 pb-24 md:pb-8">
                    <div className="max-w-7xl mx-auto">
                        {currentPath === '/dashboard/overview' && currentUser.role === 'admin' && <OverviewScreen todos={todos} />}
                        {currentPath === '/dashboard/customers' && currentUser.role === 'admin' && <CustomerAnalysisScreen users={users} todos={todos} />}
                        {currentPath === '/dashboard/branches' && currentUser.role === 'admin' && <BranchPerformanceScreen todos={todos} />}
                        {currentPath === '/dashboard/todos' && <TodosScreen user={currentUser} todos={todos} actions={actions} />}
                        {currentPath === '/admin/users' && currentUser.role === 'admin' && <UserManagementScreen users={users} actions={actions} />}

                        {currentUser.role === 'user' && currentPath.startsWith('/dashboard/') && currentPath !== '/dashboard/todos' && (
                            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500 text-center px-4">
                                <div className="bg-slate-100 p-6 rounded-full mb-6"><Users size={48} className="text-slate-300" /></div>
                                <h2 className="text-2xl font-bold text-slate-700 mb-2">ไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
                                <p className="text-slate-500 mb-8 max-w-md">หน้านี้สงวนสิทธิ์สำหรับผู้ดูแลระบบ (Admin) เพื่อดูภาพรวมของระบบเท่านั้น</p>
                                <button onClick={() => navigate('/dashboard/todos')} className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow-md active:scale-95 transition-transform">กลับไปหน้างานของฉัน</button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}