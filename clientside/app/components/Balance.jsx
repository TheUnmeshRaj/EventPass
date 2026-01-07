"use client";

import React, { useState } from "react";
import { Wallet, IndianRupee, PlusCircle } from "lucide-react";
import { updateUserBalance } from "../../lib/supabase/database";


export function Balance({ balance, setBalance, userId }) {
  const [amount, setAmount] = useState("");

  const handleAddMoney = async () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      alert("Enter a valid amount");
      return;
    }

    try {
      const updated = await updateUserBalance(
        userId,
        value,
        "USER_TOPUP"
      );

      setBalance(updated.balance);
      setAmount("");
      alert("Balance updated successfully");
    } catch (err) {
      alert(err.message || "Failed to add balance");
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 max-w-4xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Wallet className="text-emerald-600" />
          Account Balance
        </h2>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6 mb-8">
        <p className="text-slate-500 text-sm mb-2">Current Balance</p>
        <div className="flex items-center text-3xl font-bold text-emerald-700">
          <IndianRupee size={28} />
          {balance.toFixed(2)}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <PlusCircle className="text-emerald-600" />
          Add Money
        </h3>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 w-full">
            <IndianRupee size={16} className="text-slate-400" />
            <input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="outline-none bg-transparent w-full text-sm"
            />
          </div>

          <button
            onClick={handleAddMoney}
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
