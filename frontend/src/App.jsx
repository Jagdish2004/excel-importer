import React from 'react'
import FileImport from './components/FileImport'
import './App.css'

function App() {
  return (
    <div className="min-h-screen w-screen bg-gray-50 overflow-x-hidden">
      <div className="w-full min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            Excel Data Importer
          </h1>
          <FileImport />
        </div>
      </div>
    </div>
  )
}

export default App
