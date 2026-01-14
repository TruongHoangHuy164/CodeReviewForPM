import React, { useState } from 'react';
import './CodeInput.css';

const CodeInput = ({ onReview, loading }) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [fileName, setFileName] = useState('');
  const [inputMethod, setInputMethod] = useState('paste'); // 'paste' or 'upload'

  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'csharp', label: 'C#' },
    { value: 'php', label: 'PHP' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCode(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code.trim()) {
      onReview(code, language, fileName || 'code.txt');
    }
  };

  return (
    <div className="code-input-container">
      <div className="input-method-tabs">
        <button
          className={inputMethod === 'paste' ? 'active' : ''}
          onClick={() => setInputMethod('paste')}
        >
          📋 Paste Code
        </button>
        <button
          className={inputMethod === 'upload' ? 'active' : ''}
          onClick={() => setInputMethod('upload')}
        >
          📁 Upload File
        </button>
      </div>

      <form onSubmit={handleSubmit} className="code-input-form">
        <div className="form-controls">
          <div className="language-select">
            <label>Ngôn ngữ:</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {inputMethod === 'paste' ? (
          <div className="code-textarea-wrapper">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste code của bạn vào đây..."
              className="code-textarea"
              rows={15}
            />
          </div>
        ) : (
          <div className="file-upload-wrapper">
            <input
              type="file"
              id="file-upload"
              onChange={handleFileUpload}
              accept=".js,.ts,.jsx,.tsx,.py,.java,.cpp,.cs,.php,.rb,.go,.rs,.txt"
            />
            <label htmlFor="file-upload" className="file-upload-label">
              {fileName || 'Chọn file để upload'}
            </label>
            {code && (
              <div className="code-preview">
                <h4>Preview:</h4>
                <pre>{code.substring(0, 500)}...</pre>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          className="review-btn"
          disabled={!code.trim() || loading}
        >
          {loading ? 'Đang xử lý...' : '🚀 Review Code'}
        </button>
      </form>
    </div>
  );
};

export default CodeInput;
