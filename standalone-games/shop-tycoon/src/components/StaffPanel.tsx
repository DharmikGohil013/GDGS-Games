/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Users, UserPlus, Trash2, Award, Zap } from 'lucide-react';
import { StaffMember, StaffRole } from '../game/types';
import { sound } from '../game/audio';

interface StaffPanelProps {
  cash: number;
  staff: StaffMember[];
  onHireStaff: (role: StaffRole) => { success: boolean; message: string };
  onFireStaff: (staffId: string) => void;
  onClose: () => void;
}

export const StaffPanel: React.FC<StaffPanelProps> = ({
  cash,
  staff,
  onHireStaff,
  onFireStaff,
  onClose
}) => {
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const totalPayroll = staff.reduce((sum, s) => sum + s.salaryPerDay, 0);

  const hireRoles: {
    role: StaffRole;
    title: string;
    icon: string;
    hireFee: number;
    wage: number;
    desc: string;
  }[] = [
    {
      role: 'cashier',
      title: 'Checkout Cashier',
      icon: '💳',
      hireFee: 150,
      wage: 75,
      desc: 'Mans the checkout registers to scan barcodes and process customer queues at 3x speed.'
    },
    {
      role: 'restocker',
      title: 'Stockroom Clerk',
      icon: '📦',
      hireFee: 120,
      wage: 65,
      desc: 'Monitors low shelves, retrieves cartons from the warehouse, and automatically restocks aisles.'
    },
    {
      role: 'cleaner',
      title: 'Store Custodian',
      icon: '🧹',
      hireFee: 100,
      wage: 50,
      desc: 'Cleans trash, mops spills, and keeps customer satisfaction and store reputation high.'
    }
  ];

  const handleHire = (role: StaffRole) => {
    const res = onHireStaff(role);
    setStatusMsg({ text: res.message, isError: !res.success });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[95%] max-w-3xl bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl p-5 text-white z-40 pointer-events-auto max-h-[85vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-sky-400" />
          <h2 className="font-bold text-base text-slate-100">Staff Roster & Payroll Automation</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs">
            <span className="text-slate-400">Daily Payroll:</span>
            <span className="font-mono-numbers font-bold text-rose-400">${totalPayroll}/day</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close staff panel"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className={`mt-3 p-2 rounded-lg text-xs font-semibold ${
          statusMsg.isError ? 'bg-rose-950/80 text-rose-300 border border-rose-800' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
        }`}>
          {statusMsg.text}
        </div>
      )}

      {/* Main Sections */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-3 overflow-hidden flex-1">
        {/* Current Active Staff */}
        <div className="md:col-span-6 flex flex-col overflow-hidden">
          <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider flex items-center justify-between">
            <span>Current Employees ({staff.length})</span>
            <span className="text-sky-400 font-mono-numbers">{staff.filter(s => s.role === 'cashier').length} Cashiers · {staff.filter(s => s.role === 'restocker').length} Stockers</span>
          </div>
          <div className="space-y-2 overflow-y-auto max-h-72 pr-1">
            {staff.map(member => (
              <div
                key={member.id}
                className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {member.role === 'cashier' ? '💳' : member.role === 'restocker' ? '📦' : '🧹'}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{member.name}</span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-700 text-sky-300">
                        {member.role}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono-numbers mt-0.5">
                      Wage: <strong className="text-rose-300">${member.salaryPerDay}/day</strong> · State: <span className="text-emerald-400 capitalize">{member.state.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    sound.playClick();
                    onFireStaff(member.id);
                  }}
                  title="Dismiss employee"
                  className="p-2 rounded-lg bg-slate-900 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 border border-slate-700/60 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {staff.length === 0 && (
              <div className="p-6 text-center text-slate-500 text-xs italic bg-slate-900/40 rounded-xl border border-slate-800">
                No employees hired yet. Recruit staff below to automate your shop operations!
              </div>
            )}
          </div>
        </div>

        {/* Recruitment Candidates */}
        <div className="md:col-span-6 flex flex-col overflow-hidden">
          <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
            Recruitment Board
          </div>
          <div className="space-y-2.5 overflow-y-auto max-h-72 pr-1">
            {hireRoles.map(candidate => {
              const canAfford = cash >= candidate.hireFee;
              return (
                <div
                  key={candidate.role}
                  className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/70 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{candidate.icon}</span>
                      <span className="text-xs font-bold text-white">{candidate.title}</span>
                    </div>
                    <div className="text-right text-[11px] font-mono-numbers">
                      <span className="text-emerald-400 font-bold">${candidate.hireFee} hire</span>
                      <span className="text-slate-400 text-[10px]"> (${candidate.wage}/day)</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-2.5 leading-relaxed">
                    {candidate.desc}
                  </p>
                  <button
                    disabled={!canAfford}
                    onClick={() => handleHire(candidate.role)}
                    className={`w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      canAfford
                        ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 active:scale-95 shadow-md shadow-sky-950/40'
                        : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Recruit Candidate (${candidate.hireFee})</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
