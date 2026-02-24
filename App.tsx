
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Flame, 
  BarChart3, 
  History, 
  Settings, 
  Plus, 
  Thermometer, 
  Weight, 
  Droplet, 
  Clock, 
  Play, 
  CheckCircle2, 
  AlertTriangle,
  Lightbulb,
  LayoutGrid,
  ChevronRight,
  Activity
} from 'lucide-react';
import { BatchStatus, CharcoalBatch, TemperatureReading, Kiln } from './types';
import { MOCK_HISTORY, MOCK_MONTHLY, MOCK_KILNS } from './constants';
import TemperatureChart from './components/TemperatureChart';
import DashboardCharts from './components/DashboardCharts';
import Auth from './components/Auth';
import { getKilnOptimizationAdvice } from './services/geminiService';

const App: React.FC = () => {
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'kilns' | 'monitor' | 'stats' | 'history'>('kilns');
  const [kilns, setKilns] = useState<Kiln[]>(MOCK_KILNS);
  const [selectedKilnId, setSelectedKilnId] = useState<string | null>(null);
  const [history, setHistory] = useState<CharcoalBatch[]>(MOCK_HISTORY);
  const [isStarting, setIsStarting] = useState(false);
  const [formData, setFormData] = useState({ materialInput: 0, fuelUsed: 0 });
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  const activeKiln = kilns.find(k => k.id === selectedKilnId);
  const activeBatch = activeKiln?.currentBatch || null;

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Simulation of temperature reading for all active batches
  useEffect(() => {
    const interval = setInterval(() => {
      setKilns(currentKilns => currentKilns.map(kiln => {
        if (!kiln.currentBatch || kiln.currentBatch.status === BatchStatus.IDLE || kiln.currentBatch.status === BatchStatus.COMPLETED) {
          return kiln;
        }

        const prevBatch = kiln.currentBatch;
        const lastTemp = prevBatch.temperatures[prevBatch.temperatures.length - 1]?.temp || 30;
        let nextTemp = lastTemp;
        let nextStatus = prevBatch.status;
        
        if (nextStatus === BatchStatus.HEATING) {
          nextTemp += 5 + Math.random() * 10;
          if (nextTemp > 300) nextStatus = BatchStatus.BURNING;
        } else if (nextStatus === BatchStatus.BURNING) {
          nextTemp += Math.random() * 5 - 2;
          if (prevBatch.temperatures.length > 30) nextStatus = BatchStatus.COOLING;
        } else if (nextStatus === BatchStatus.COOLING) {
          nextTemp -= 5 + Math.random() * 5;
          if (nextTemp < 50) {
            nextStatus = BatchStatus.COMPLETED;
            const completedBatch = {
              ...prevBatch,
              status: nextStatus,
              endTime: new Date().toLocaleTimeString(),
              materialOutput: Math.floor(prevBatch.materialInput * 0.3)
            };
            setHistory(h => [completedBatch, ...h]);
            return { ...kiln, currentBatch: completedBatch, lastCompletedBatch: completedBatch };
          }
        }

        return {
          ...kiln,
          currentBatch: {
            ...prevBatch,
            status: nextStatus,
            temperatures: [...prevBatch.temperatures, { 
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
              temp: Math.max(30, nextTemp) 
            }].slice(-20)
          }
        };
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStartBatch = () => {
    if (!selectedKilnId) return;
    
    const newBatch: CharcoalBatch = {
      id: `B${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      materialInput: formData.materialInput,
      materialOutput: 0,
      fuelUsed: formData.fuelUsed,
      startTime: new Date().toLocaleTimeString(),
      status: BatchStatus.HEATING,
      temperatures: [{ time: new Date().toLocaleTimeString(), temp: 32 }]
    };

    setKilns(prev => prev.map(k => k.id === selectedKilnId ? { ...k, currentBatch: newBatch } : k));
    setIsStarting(false);
    fetchAdvice(newBatch);
  };

  const fetchAdvice = async (batch: CharcoalBatch) => {
    setLoadingAdvice(true);
    const advice = await getKilnOptimizationAdvice(batch);
    setAiAdvice(advice);
    setLoadingAdvice(false);
  };

  const handleSelectKiln = (kilnId: string) => {
    setSelectedKilnId(kilnId);
    setActiveTab('monitor');
    const kiln = kilns.find(k => k.id === kilnId);
    if (kiln?.currentBatch && kiln.currentBatch.status !== BatchStatus.COMPLETED) {
      fetchAdvice(kiln.currentBatch);
    } else {
      setAiAdvice('');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const renderKilnSummary = () => (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-slate-800">สถานะเตาทั้งหมด</h2>
        <div className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold">
          {kilns.length} เตาในระบบ
        </div>
      </div>

      <div className="grid gap-4">
        {kilns.map((kiln) => {
          const status = kiln.currentBatch?.status || BatchStatus.IDLE;
          const isWorking = status !== BatchStatus.IDLE && status !== BatchStatus.COMPLETED;
          const isCompleted = status === BatchStatus.COMPLETED;
          const temp = kiln.currentBatch?.temperatures[kiln.currentBatch.temperatures.length - 1]?.temp || 0;

          return (
            <div 
              key={kiln.id} 
              onClick={() => handleSelectKiln(kiln.id)}
              className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm active:scale-[0.98] transition-all cursor-pointer hover:shadow-md"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${isWorking ? 'bg-orange-100 text-orange-600' : isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    <Flame size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{kiln.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`h-2 w-2 rounded-full ${isWorking ? 'bg-orange-500 animate-pulse' : isCompleted ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className={`text-sm font-medium ${isWorking ? 'text-orange-600' : isCompleted ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {isWorking ? 'กำลังเผาไหม้' : isCompleted ? 'เผาแล้วเสร็จ' : 'ว่าง'}
                      </span>
                    </div>
                  </div>
                </div>
                {isWorking && (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-800">{Math.round(temp)}°C</p>
                    <p className="text-xs text-slate-400">อุณหภูมิปัจจุบัน</p>
                  </div>
                )}
              </div>

              {isWorking && (
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Weight size={14} />
                      <span>{kiln.currentBatch?.materialInput} kg</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Droplet size={14} className="text-blue-500" />
                      <span>{kiln.currentBatch?.fuelUsed} L</span>
                    </div>
                  </div>
                  <div className="flex items-center text-orange-600 font-bold gap-1">
                    ดูรายละเอียด <ChevronRight size={16} />
                  </div>
                </div>
              )}

              {!isWorking && isCompleted && (
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                   <p className="text-sm text-slate-500">ผลผลิตล่าสุด: <span className="text-emerald-600 font-bold">{kiln.currentBatch?.materialOutput} kg</span></p>
                   <button className="text-xs bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg font-bold">รับผลผลิต</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderMonitor = () => (
    <div className="space-y-6 pb-24">
      {/* Selection Header */}
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => setActiveTab('kilns')} className="text-slate-400">
          <ChevronRight size={24} className="rotate-180" />
        </button>
        <h2 className="text-xl font-bold">{activeKiln?.name || 'เลือกเตาเผา'}</h2>
      </div>

      {!activeKiln ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center">
          <Activity size={64} className="mb-4 opacity-10" />
          <p>กรุณาเลือกเตาที่ต้องการมอนิเตอร์จากหน้าหลัก</p>
          <button 
            onClick={() => setActiveTab('kilns')}
            className="mt-6 text-orange-500 font-bold underline"
          >
            ไปที่หน้าสรุปสถานะ
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Weight size={16} />
                <span className="text-sm">วัตถุดิบ</span>
              </div>
              <p className="text-xl font-bold">{activeBatch?.materialInput || 0} <span className="text-sm font-normal text-slate-400">kg</span></p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Droplet size={16} className="text-blue-500" />
                <span className="text-sm">เชื้อเพลิง</span>
              </div>
              <p className="text-xl font-bold">{activeBatch?.fuelUsed || 0} <span className="text-sm font-normal text-slate-400">L</span></p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100 relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-slate-400 text-sm font-medium uppercase tracking-wider">สถานะการเผาไหม้</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`h-3 w-3 rounded-full animate-pulse ${
                    activeBatch?.status === BatchStatus.HEATING ? 'bg-orange-500' :
                    activeBatch?.status === BatchStatus.BURNING ? 'bg-red-500' :
                    activeBatch?.status === BatchStatus.COOLING ? 'bg-blue-400' : 'bg-slate-300'
                  }`} />
                  <p className="text-xl font-bold">
                    {activeBatch ? (
                      activeBatch.status === BatchStatus.HEATING ? 'กำลังวอร์มเตา' :
                      activeBatch.status === BatchStatus.BURNING ? 'กำลังเผาไหม้' :
                      activeBatch.status === BatchStatus.COOLING ? 'กำลังคูลดาวน์' :
                      activeBatch.status === BatchStatus.COMPLETED ? 'เสร็จสิ้น' : 'รอการเริ่ม'
                    ) : 'ว่าง'}
                  </p>
                </div>
              </div>
              <div className="bg-orange-50 p-3 rounded-2xl">
                <Thermometer className="text-orange-500" size={32} />
              </div>
            </div>

            <div className="flex items-baseline justify-center my-8">
              <span className="text-7xl font-bold tracking-tighter text-slate-800">
                {Math.round(activeBatch?.temperatures[activeBatch.temperatures.length - 1]?.temp || 0)}
              </span>
              <span className="text-3xl font-medium text-slate-400 ml-2">°C</span>
            </div>

            {activeBatch && <TemperatureChart data={activeBatch.temperatures} />}
          </div>

          {activeBatch && activeBatch.status !== BatchStatus.COMPLETED && (
            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 shadow-sm">
              <div className="flex items-center gap-2 text-amber-700 font-bold mb-3">
                <Lightbulb size={20} />
                <span>AI แนะนำการเผา</span>
              </div>
              {loadingAdvice ? (
                <div className="animate-pulse flex space-y-2 flex-col">
                  <div className="h-4 bg-amber-200 rounded w-full"></div>
                  <div className="h-4 bg-amber-200 rounded w-3/4"></div>
                </div>
              ) : (
                <p className="text-amber-800 text-sm leading-relaxed whitespace-pre-line">
                  {aiAdvice || "กำลังประมวลผลข้อมูลเตาเพื่อหาแนวทางที่ดีที่สุด..."}
                </p>
              )}
            </div>
          )}

          {!activeBatch ? (
            <button 
              onClick={() => setIsStarting(true)}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
            >
              <Plus size={24} />
              เริ่มรอบการเผาใหม่ สำหรับ {activeKiln.name}
            </button>
          ) : activeBatch.status === BatchStatus.COMPLETED ? (
            <button 
              onClick={() => {
                setKilns(prev => prev.map(k => k.id === selectedKilnId ? { ...k, currentBatch: null } : k));
                setActiveTab('kilns');
              }}
              className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
            >
              <CheckCircle2 size={24} />
              เสร็จสิ้น / กลับหน้าสรุป
            </button>
          ) : (
            <div className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center gap-4">
              <Clock className="text-slate-400" />
              <div className="flex-1">
                <p className="text-xs text-slate-500">เวลาเริ่ม</p>
                <p className="font-bold">{activeBatch.startTime}</p>
              </div>
              <div className="h-8 w-px bg-slate-100" />
              <div className="flex-1">
                <p className="text-xs text-slate-500">สถานะ</p>
                <p className="font-bold text-orange-600">กำลังทำงาน...</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderStats = () => (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">แดชบอร์ดสรุปผล</h2>
        <select className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-sm font-medium outline-none">
          <option>2024</option>
          <option>2023</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-blue-200 shadow-lg">
          <p className="text-blue-100 text-sm">วัตถุดิบรวมปีนี้</p>
          <p className="text-2xl font-bold mt-1">15,600 <span className="text-sm font-normal">kg</span></p>
        </div>
        <div className="bg-emerald-600 p-4 rounded-2xl text-white shadow-emerald-200 shadow-lg">
          <p className="text-emerald-100 text-sm">ถ่านรวมปีนี้</p>
          <p className="text-2xl font-bold mt-1">4,520 <span className="text-sm font-normal">kg</span></p>
        </div>
      </div>

      <DashboardCharts data={MOCK_MONTHLY} />

      <div className="bg-white p-6 rounded-2xl border border-slate-100">
        <h3 className="font-bold mb-4">ประสิทธิภาพเฉลี่ย</h3>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">อัตราการผลิตถ่าน</span>
          <span className="text-emerald-600 font-bold">28.9%</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
          <div className="bg-emerald-500 h-full w-[28.9%]" />
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-4 pb-24">
       <h2 className="text-2xl font-bold text-slate-800 mb-6">ประวัติการเผา</h2>
       {history.map((batch) => (
         <div key={batch.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-slate-100 p-3 rounded-xl">
                <History className="text-slate-600" size={20} />
              </div>
              <div>
                <p className="font-bold text-slate-800">{batch.date}</p>
                <p className="text-sm text-slate-500">Batch: {batch.id} • {batch.materialInput}kg</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-emerald-600">+{batch.materialOutput} kg</p>
              <p className="text-xs text-slate-400">ใช้น้ำมัน {batch.fuelUsed}L</p>
            </div>
         </div>
       ))}
    </div>
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-12 w-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth onLoginSuccess={(userData) => setUser(userData)} />;
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 relative">
      {/* Top Header */}
      <header className="px-6 pt-8 pb-4 bg-slate-50 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Mtech <span className="text-orange-500">Smart Power</span></h1>
            <p className="text-sm text-slate-500">สวัสดี, {user.username}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 text-slate-400 hover:text-red-500 transition-colors"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 pt-4">
        {activeTab === 'kilns' && renderKilnSummary()}
        {activeTab === 'monitor' && renderMonitor()}
        {activeTab === 'stats' && renderStats()}
        {activeTab === 'history' && renderHistory()}
      </main>

      {/* New Batch Modal */}
      {isStarting && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-[40px] p-8 animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-6">ป้อนข้อมูล: {activeKiln?.name}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">ปริมาณวัตถุดิบ (kg)</label>
                <input 
                  type="number" 
                  placeholder="เช่น 500"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-orange-500"
                  onChange={(e) => setFormData({...formData, materialInput: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">ปริมาณเชื้อเพลิงน้ำมัน (ลิตร)</label>
                <input 
                  type="number" 
                  placeholder="เช่น 10"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-orange-500"
                  onChange={(e) => setFormData({...formData, fuelUsed: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="pt-4 flex gap-4">
                <button 
                  onClick={() => setIsStarting(false)}
                  className="flex-1 py-4 rounded-2xl font-bold text-slate-500"
                >
                  ยกเลิก
                </button>
                <button 
                  onClick={handleStartBatch}
                  className="flex-1 bg-orange-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-200 active:scale-95 transition-transform"
                >
                  เริ่มการทำงาน
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-slate-900/90 backdrop-blur-md rounded-3xl p-4 flex justify-around items-center z-40 border border-white/10 shadow-2xl">
        <button 
          onClick={() => setActiveTab('kilns')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'kilns' ? 'text-orange-400 scale-110' : 'text-slate-500'}`}
        >
          <LayoutGrid size={24} />
          <span className="text-[10px] font-medium">เตาเผา</span>
        </button>
        <button 
          onClick={() => setActiveTab('monitor')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'monitor' ? 'text-orange-400 scale-110' : 'text-slate-500'}`}
        >
          <Activity size={24} />
          <span className="text-[10px] font-medium">มอนิเตอร์</span>
        </button>
        <button 
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'stats' ? 'text-orange-400 scale-110' : 'text-slate-500'}`}
        >
          <BarChart3 size={24} />
          <span className="text-[10px] font-medium">สรุปผล</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'history' ? 'text-orange-400 scale-110' : 'text-slate-500'}`}
        >
          <History size={24} />
          <span className="text-[10px] font-medium">ประวัติ</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
