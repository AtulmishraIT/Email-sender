"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function Home() {
  const [file, setFile] = useState(null)
  const [pastedData, setPastedData] = useState("")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("paste")
  const [emailHistory, setEmailHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [showEmails, setShowEmails] = useState(false)

  useEffect(() => {
    const savedHistory = localStorage.getItem("emailHistory")
    if (savedHistory) {
      setEmailHistory(JSON.parse(savedHistory))
    }
  }, [])

  const saveToHistory = (batchResults) => {
    const batch = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      totalEmails: batchResults.length,
      Emails: pastedData,
      successCount: batchResults.filter((r) => r.status === "success").length,
      failureCount: batchResults.filter((r) => r.status === "failed").length,
      results: batchResults,
    }

    const updatedHistory = [batch, ...emailHistory].slice(0, 50) // Keep last 50 batches
    setEmailHistory(updatedHistory)
    localStorage.setItem("emailHistory", JSON.stringify(updatedHistory))
  }

  const handleFileSubmit = async (e) => {
    e.preventDefault()
    if (!file) return alert("Please select an Excel file.")

    const formData = new FormData()
    formData.append("file", file)

    setLoading(true)
    setResults([])

    try {
      const res = await fetch("/api/send-emails", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      setResults(data.results || [])
      if (data.results && data.results.length > 0) {
        saveToHistory(data.results)
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to send emails. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handlePasteSubmit = async (e) => {
    e.preventDefault()
    if (!pastedData.trim()) return alert("Please paste some data.")

    setLoading(true)
    setResults([])

    try {
      const res = await fetch("/api/send-emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pastedData }),
      })

      const data = await res.json()
      setResults(data.results || [])
      if (data.results && data.results.length > 0) {
        saveToHistory(data.results)
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to send emails. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = () => {
    setEmailHistory([])
    localStorage.removeItem("emailHistory")
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.1 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        <motion.div className="text-center space-y-4" variants={itemVariants}>
          <motion.h1
            className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            Bulk Email Sender
          </motion.h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Send emails to multiple recipients using Excel files or copy-paste data with real-time tracking
          </p>

          <motion.button
            onClick={() => setShowHistory(!showHistory)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            📊 {showHistory ? "Hide" : "Show"} Email History ({emailHistory.length})
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Email History</h2>
                  <p className="text-gray-600 mt-1">Track all your email campaigns</p>
                </div>
                {emailHistory.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Clear History
                  </button>
                )}
              </div>
              <div className="p-6 max-h-96 overflow-y-auto">
                {emailHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No email history yet. Send some emails to see them here!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {emailHistory.map((batch) => (
                      <motion.div
                        key={batch.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <p className="font-medium">{new Date(batch.timestamp).toLocaleString()}</p>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <p className="text-sm text-gray-600">
                              {batch.totalEmails} emails • {batch.successCount} sent • {batch.failureCount} failed
                            </p>
                            <button className="text-sm text-gray-900 cursor-pointer" onClick={() => {setShowEmails(!showEmails)}}>{showEmails ? "Hide Emails" : "Show Emails"}</button>
                            </div>
                            {showEmails && (<div className="mt-2 max-h-40 overflow-y-auto p-2 bg-gray-50 border border-gray-200 rounded-lg">
                              <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap">{batch.Emails}</pre>
                            </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              ✅ {batch.successCount}
                            </span>
                            {batch.failureCount > 0 && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                ❌ {batch.failureCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
          variants={itemVariants}
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Choose Input Method</h2>
            <p className="text-gray-600 mt-1">Upload an Excel file or paste data directly from Excel/Google Sheets</p>
          </div>
          <div className="p-6">
            <div className="mb-6">
              <div className="flex border-b border-gray-200">
                <motion.button
                  onClick={() => setActiveTab("paste")}
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-all ${
                    activeTab === "paste"
                      ? "border-blue-500 text-blue-600 bg-blue-50"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  📋 Copy & Paste
                </motion.button>
                <motion.button
                  onClick={() => setActiveTab("file")}
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-all ${
                    activeTab === "file"
                      ? "border-blue-500 text-blue-600 bg-blue-50"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  📁 Upload File
                </motion.button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "paste" && (
                <motion.div
                  key="paste"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <form onSubmit={handlePasteSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="pastedData" className="block text-sm font-medium text-gray-700">
                        Paste Excel Data
                      </label>
                      <textarea
                        id="pastedData"
                        placeholder="Paste your data here (Name, Email format expected)&#10;John Doe	john@example.com&#10;Jane Smith	jane@example.com"
                        value={pastedData}
                        onChange={(e) => setPastedData(e.target.value)}
                        rows={8}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm transition-all"
                      />
                      <p className="text-sm text-gray-500">
                        Expected format: Name and Email separated by tab or comma. Each row on a new line.
                      </p>
                    </div>
                    <motion.button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                      whileHover={{ scale: loading ? 1 : 1.02 }}
                      whileTap={{ scale: loading ? 1 : 0.98 }}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <motion.div
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                          />
                          Sending...
                        </span>
                      ) : (
                        "Send Emails"
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              )}

              {activeTab === "file" && (
                <motion.div
                  key="file"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <form onSubmit={handleFileSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                        Excel File
                      </label>
                      <motion.div
                        className="relative"
                        whileHover={{ scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <input
                          id="file"
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={(e) => setFile(e.target.files[0])}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-all"
                        />
                      </motion.div>
                      <p className="text-sm text-gray-500">Upload an Excel file with Name and Email columns.</p>
                    </div>
                    <motion.button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                      whileHover={{ scale: loading ? 1 : 1.02 }}
                      whileTap={{ scale: loading ? 1 : 0.98 }}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <motion.div
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                          />
                          Sending...
                        </span>
                      ) : (
                        "Send Emails"
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Email Results</h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                  <p className="text-gray-600">
                    {results.filter((r) => r.status === "success").length} of {results.length} emails sent successfully
                  </p>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      ✅ {results.filter((r) => r.status === "success").length} Success
                    </span>
                    {results.filter((r) => r.status === "failed").length > 0 && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        ❌ {results.filter((r) => r.status === "failed").length} Failed
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
                  {results.map((result, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: idx * 0.05 + 0.2, type: "spring" }}
                          className="text-xl flex-shrink-0"
                        >
                          {result.status === "success" ? "✅" : "❌"}
                        </motion.span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{result.name || "Unknown"}</p>
                          <p className="text-sm text-gray-500 truncate">{result.email}</p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                          result.status === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {result.status === "success" ? "Sent" : "Failed"}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
