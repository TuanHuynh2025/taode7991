import React, { useState, useRef, useEffect } from 'react';
import { Printer, RefreshCw, Settings, CheckCircle2, GraduationCap, FileText, Upload, FileType, Trash2, FileDown, BookOpen, Layers } from 'lucide-react';
import { DEFAULT_CONFIG, CURRICULUM_DATA } from './constants';
import { DifficultyLevel, ExamConfig, ExamMode, Question, QuestionType, Topic } from './types';
import { generateExamQuestions } from './services/geminiService';
import MathJaxComponent from './components/MathJaxComponent';
import MultiSelect from './components/MultiSelect';
import ChatBox from './components/ChatBox';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [showSolutions, setShowSolutions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [config, setConfig] = useState<ExamConfig>({
    mode: 'file', // Default mode
    numMC: DEFAULT_CONFIG.numMC,
    numTF: DEFAULT_CONFIG.numTF,
    numShort: DEFAULT_CONFIG.numShort,
    numEssay: DEFAULT_CONFIG.numEssay,
    difficulty: DifficultyLevel.MEDIUM,
    uploadedFileBase64: null,
    uploadedFileMimeType: null,
    selectedChapters: [],
    selectedTopics: []
  });

  const [fileName, setFileName] = useState<string | null>(null);
  
  // Computed available topics based on selected chapters
  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);

  useEffect(() => {
    // When chapters change, update available topics list
    const topics: Topic[] = [];
    CURRICULUM_DATA.forEach(chapter => {
      if (config.selectedChapters.includes(chapter.id)) {
        topics.push(...chapter.topics);
      }
    });
    setAvailableTopics(topics);
  }, [config.selectedChapters]);

  const handleChapterChange = (chapterIds: string[]) => {
    // Logic: If a new chapter is added, auto-select all its topics
    // If a chapter is removed, remove its topics from selection
    const newTopics = [...config.selectedTopics];
    const addedChapters = chapterIds.filter(id => !config.selectedChapters.includes(id));
    const removedChapters = config.selectedChapters.filter(id => !chapterIds.includes(id));

    // Add topics for new chapters
    addedChapters.forEach(chId => {
      const chapter = CURRICULUM_DATA.find(c => c.id === chId);
      if (chapter) {
        chapter.topics.forEach(t => {
          if (!newTopics.includes(t.id)) newTopics.push(t.id);
        });
      }
    });

    // Remove topics for removed chapters
    let finalTopics = newTopics;
    if (removedChapters.length > 0) {
       const topicsToRemove = new Set<string>();
       removedChapters.forEach(chId => {
          const chapter = CURRICULUM_DATA.find(c => c.id === chId);
          chapter?.topics.forEach(t => topicsToRemove.add(t.id));
       });
       finalTopics = newTopics.filter(tId => !topicsToRemove.has(tId));
    }

    setConfig({
      ...config,
      selectedChapters: chapterIds,
      selectedTopics: finalTopics
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // Limit 10MB
        alert("File quá lớn. Vui lòng chọn file nhỏ hơn 10MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Content = base64String.split(',')[1];
        
        setConfig({
          ...config,
          uploadedFileBase64: base64Content,
          uploadedFileMimeType: file.type
        });
        setFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setConfig({
      ...config,
      uploadedFileBase64: null,
      uploadedFileMimeType: null
    });
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    if (config.mode === 'file' && !config.uploadedFileBase64) {
      alert("Vui lòng upload file đề mẫu (PDF) để AI có thể tạo đề tương tự.");
      return;
    }

    if (config.mode === 'curriculum' && config.selectedTopics.length === 0) {
      alert("Vui lòng chọn ít nhất một chương hoặc bài học để tạo đề.");
      return;
    }

    setLoading(true);
    setExamQuestions([]);
    setShowSolutions(false);
    try {
      const questions = await generateExamQuestions(config);
      setExamQuestions(questions);
    } catch (error) {
      alert("Có lỗi xảy ra khi tạo đề. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = () => {
    if (examQuestions.length === 0) return;

    const renderText = (content: string) => content.replace(/\n/g, '<br/>');

    let bodyContent = '';

    const types = [
      { type: QuestionType.MULTIPLE_CHOICE, title: "PHẦN I. TRẮC NGHIỆM KHÁCH QUAN" },
      { type: QuestionType.TRUE_FALSE, title: "PHẦN II. TRẮC NGHIỆM ĐÚNG SAI" },
      { type: QuestionType.SHORT_ANSWER, title: "PHẦN III. TRẮC NGHIỆM TRẢ LỜI NGẮN" },
      { type: QuestionType.ESSAY, title: "PHẦN IV. TỰ LUẬN" }
    ];

    types.forEach(t => {
      const questions = examQuestions.filter(q => q.type === t.type);
      if (questions.length > 0) {
        bodyContent += `<h3 style="margin-top: 20px; text-transform: uppercase;">${t.title}</h3>`;
        questions.forEach((q, idx) => {
          bodyContent += `<div style="margin-bottom: 15px;">`;
          bodyContent += `<p><b>Câu ${idx + 1}.</b> ${renderText(q.content)}</p>`;
          
          if (q.type === QuestionType.MULTIPLE_CHOICE && q.options) {
             bodyContent += `<div style="margin-left: 20px;">`;
             q.options.forEach((opt, optIdx) => {
                const label = String.fromCharCode(65 + optIdx);
                bodyContent += `<p><b>${label}.</b> ${renderText(opt)}</p>`;
             });
             bodyContent += `</div>`;
          }

          if (q.type === QuestionType.TRUE_FALSE && q.subQuestions) {
             bodyContent += `<table border="1" style="border-collapse: collapse; width: 100%; margin-top: 5px;">`;
             q.subQuestions.forEach(sub => {
                bodyContent += `<tr><td style="padding: 5px; width: 30px;"><b>${sub.id})</b></td><td style="padding: 5px;">${renderText(sub.content)}</td><td style="width: 100px; text-align: center;">Đ / S</td></tr>`;
             });
             bodyContent += `</table>`;
          }

          if (q.type === QuestionType.SHORT_ANSWER) {
             bodyContent += `<p><i>Trả lời: ............................................................</i></p>`;
          }
          
          bodyContent += `</div>`;
        });
      }
    });

    const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Exam Export</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; }
      </style>
      </head><body>
      <div style="text-align: center; font-weight: bold; margin-bottom: 20px;">
        <p style="margin: 0;">SỞ GIÁO DỤC VÀ ĐÀO TẠO</p>
        <p style="margin: 0; text-transform: uppercase;">ĐỀ KIỂM TRA MÔN TOÁN 9</p>
      </div>
    `;

    const footer = "</body></html>";
    const sourceHTML = header + bodyContent + footer;

    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = 'de_kiem_tra_toan_9.doc';
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  const renderQuestionsByType = (type: QuestionType, title: string) => {
    const questions = examQuestions.filter(q => q.type === type);
    if (questions.length === 0) return null;

    return (
      <div className="mb-8 break-inside-avoid-page">
        {/* Section Header */}
        <div className="mb-4 pb-2 border-b-2 border-black/10">
          <h2 className="text-lg font-bold uppercase text-slate-900 print:text-black">
            {title}
          </h2>
        </div>

        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="break-inside-avoid relative">
              {/* Question Stem */}
              <div className="flex gap-2 items-baseline mb-2 text-justify">
                <span className="font-bold whitespace-nowrap text-slate-900 print:text-black">Câu {idx + 1}.</span>
                <div className="flex-1">
                  <MathJaxComponent content={q.content} className="text-slate-900 leading-relaxed" />
                </div>
                {q.points > 0 && (
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 print:hidden select-none">
                    {q.points}đ
                  </span>
                )}
              </div>

              {/* Multiple Choice Options */}
              {type === QuestionType.MULTIPLE_CHOICE && q.options && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3 ml-0 md:ml-6 mt-1">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex gap-2 items-baseline hover:bg-slate-50 rounded px-1 -ml-1 transition-colors print:hover:bg-transparent">
                      <span className="font-bold text-slate-800 min-w-[20px]">{String.fromCharCode(65 + oIdx)}.</span>
                      <div className="text-slate-800"><MathJaxComponent content={opt} /></div>
                    </div>
                  ))}
                </div>
              )}

              {/* True/False Sub-questions */}
              {type === QuestionType.TRUE_FALSE && q.subQuestions && (
                <div className="ml-0 md:ml-4 mt-3 mb-2">
                  <table className="w-full text-sm text-left border-collapse border border-slate-300">
                    <thead className="bg-slate-100 text-slate-800 font-bold print:bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 border border-slate-300 w-12 text-center">Ý</th>
                        <th className="px-3 py-2 border border-slate-300">Nội dung khẳng định</th>
                        <th className="px-2 py-2 border border-slate-300 w-16 text-center">Đúng</th>
                        <th className="px-2 py-2 border border-slate-300 w-16 text-center">Sai</th>
                      </tr>
                    </thead>
                    <tbody>
                      {q.subQuestions.map((sub, sIdx) => (
                        <tr key={sIdx} className="hover:bg-slate-50 print:hover:bg-transparent">
                          <td className="px-3 py-2 border border-slate-300 font-bold text-center">{sub.id})</td>
                          <td className="px-3 py-2 border border-slate-300 text-slate-900 leading-relaxed">
                            <MathJaxComponent content={sub.content} />
                          </td>
                          <td className="px-2 py-2 border border-slate-300 text-center">
                             {/* Empty box for student to check */}
                             <div className="w-4 h-4 border border-slate-400 mx-auto rounded-sm print:border-black"></div>
                          </td>
                          <td className="px-2 py-2 border border-slate-300 text-center">
                             <div className="w-4 h-4 border border-slate-400 mx-auto rounded-sm print:border-black"></div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Short Answer Input */}
              {type === QuestionType.SHORT_ANSWER && (
                 <div className="ml-0 md:ml-6 mt-2 flex items-end gap-2 text-slate-800">
                    <span className="italic font-serif">Trả lời:</span>
                    <div className="flex-1 border-b border-dotted border-slate-400 h-6"></div>
                 </div>
              )}

              {/* Essay Space */}
              {type === QuestionType.ESSAY && (
                <div className="ml-0 mt-3">
                   <div className="flex gap-2 items-center mb-1 text-sm text-slate-500 italic print:text-black">
                      <span>Bài làm:</span>
                   </div>
                   <div className="w-full h-32 border border-slate-200 rounded-md bg-slate-50/50 print:bg-transparent print:border-none print:h-40">
                      {/* Grid lines for essay in print mode could be added here if complex CSS allowed, 
                          but keeping it empty is standard for exam papers that provide separate sheets */}
                   </div>
                </div>
              )}

              {/* Solution / Answer Key */}
              {showSolutions && (
                 <div className="mt-3 ml-0 md:ml-6 p-3 bg-teal-50/80 border-l-4 border-teal-500 rounded-r text-sm text-teal-900 print:hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="font-bold text-teal-800 mb-1 flex items-center gap-1.5 uppercase text-xs tracking-wider">
                      <CheckCircle2 size={14}/> Hướng dẫn giải
                    </div>
                    
                    {type === QuestionType.TRUE_FALSE && q.subQuestions ? (
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          {q.subQuestions.map(sub => (
                            <div key={sub.id} className="flex justify-between items-center bg-white px-3 py-1.5 rounded shadow-sm border border-teal-100">
                               <span className="font-bold text-teal-700">{sub.id})</span>
                               <span className={sub.isCorrect ? "text-green-600 font-bold bg-green-50 px-2 rounded" : "text-red-500 font-bold bg-red-50 px-2 rounded"}>
                                 {sub.isCorrect ? "ĐÚNG" : "SAI"}
                               </span>
                            </div>
                          ))}
                       </div>
                    ) : (
                       <div className="prose prose-sm prose-teal max-w-none">
                          <MathJaxComponent content={q.correctAnswer || 'Đang cập nhật...'} />
                       </div>
                    )}
                 </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 print:bg-white">
      {/* Header - Hidden in Print */}
      <header className="bg-teal-700 text-white shadow-lg sticky top-0 z-50 print:hidden">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-full shadow-md">
               <GraduationCap size={20} className="text-teal-700" />
            </div>
            <div>
              <h1 className="text-xl font-bold uppercase tracking-wide">MathGen 9</h1>
              <p className="text-xs text-teal-100 opacity-90">Tạo đề thi Toán 9 - Chân Trời Sáng Tạo</p>
            </div>
          </div>
          <div className="flex gap-2">
             <button 
              onClick={handleExportWord}
              disabled={examQuestions.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-teal-600"
              title="Tải file Word (.doc)"
            >
              <FileDown size={18} />
              <span className="hidden sm:inline">Tải Word</span>
            </button>
             <button 
              onClick={() => setShowSolutions(!showSolutions)}
              disabled={examQuestions.length === 0}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium border ${showSolutions ? 'bg-white text-teal-800 border-white' : 'bg-teal-600 hover:bg-teal-500 text-white border-teal-500'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <CheckCircle2 size={18} />
              <span className="hidden sm:inline">{showSolutions ? 'Ẩn đáp án' : 'Hiện đáp án'}</span>
            </button>
            <button 
              onClick={handlePrint}
              disabled={examQuestions.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-white text-teal-800 rounded-md font-bold text-sm hover:bg-teal-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm border border-transparent"
            >
              <Printer size={18} />
              <span className="hidden sm:inline">In đề</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6 print:p-0 print:block">
        
        {/* Sidebar Configuration - Hidden in Print */}
        <aside className="w-full lg:w-96 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col print:hidden sticky top-20 h-fit max-h-[calc(100vh-6rem)] overflow-y-auto">
          
          {/* Mode Tabs */}
          <div className="flex border-b border-slate-200">
            <button 
              onClick={() => setConfig({...config, mode: 'file'})}
              className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${config.mode === 'file' ? 'text-teal-700 bg-teal-50 border-b-2 border-teal-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Upload size={16} /> Từ File
            </button>
            <button 
              onClick={() => setConfig({...config, mode: 'curriculum'})}
              className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${config.mode === 'curriculum' ? 'text-teal-700 bg-teal-50 border-b-2 border-teal-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <BookOpen size={16} /> Từ Chương Trình
            </button>
          </div>

          <div className="p-5 space-y-6">
            <div className="flex items-center gap-2 text-teal-800 font-bold border-b border-slate-100 pb-2">
              <Settings size={18} />
              <h2>Cấu hình chi tiết</h2>
            </div>

            {/* Mode Specific Inputs */}
            {config.mode === 'file' ? (
              /* File Upload Section */
              <div className="bg-slate-50 p-4 rounded-lg border-2 border-dashed border-slate-300 hover:border-teal-400 transition-colors group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                 <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2 pointer-events-none">
                   Upload file đề mẫu
                 </label>
                 <input 
                   type="file" 
                   accept=".pdf"
                   className="hidden"
                   ref={fileInputRef}
                   onChange={handleFileChange}
                   onClick={(e) => e.stopPropagation()} 
                 />
                 {!fileName ? (
                   <div className="w-full py-6 flex flex-col justify-center items-center gap-2 text-slate-400 group-hover:text-teal-600 transition-colors">
                     <Upload size={32} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                     <span className="text-xs font-medium">Nhấn để chọn file PDF</span>
                   </div>
                 ) : (
                   <div className="flex items-center justify-between bg-white px-3 py-2 rounded border border-teal-200 shadow-sm" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2 overflow-hidden">
                         <FileType size={18} className="text-red-500 flex-shrink-0" />
                         <span className="text-sm text-slate-700 truncate max-w-[140px] font-medium" title={fileName}>{fileName}</span>
                      </div>
                      <button onClick={removeFile} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                         <Trash2 size={16} />
                      </button>
                   </div>
                 )}
              </div>
            ) : (
              /* Curriculum Selection Section */
              <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                 <MultiSelect 
                    label="Chọn Chương" 
                    options={CURRICULUM_DATA.map(c => ({ id: c.id, name: c.name }))}
                    selectedValues={config.selectedChapters}
                    onChange={handleChapterChange}
                    placeholder="Chọn các chương..."
                 />
                 
                 <MultiSelect 
                    label="Chọn Bài / Chủ đề" 
                    options={availableTopics.map(t => ({ id: t.id, name: t.name }))}
                    selectedValues={config.selectedTopics}
                    onChange={(vals) => setConfig({...config, selectedTopics: vals})}
                    placeholder={availableTopics.length === 0 ? "Vui lòng chọn chương trước" : "Chọn chủ đề..."}
                    disabled={availableTopics.length === 0}
                 />
              </div>
            )}

            {/* Counts Configuration (Shared) */}
            <div>
               <label className="block text-sm font-semibold text-slate-700 mb-3 border-b border-slate-100 pb-1 flex items-center gap-2">
                 <Layers size={16} /> Cấu trúc đề
               </label>
               <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-slate-600">Trắc nghiệm (4 LC)</label>
                    <input 
                      type="number" min="0" max="50"
                      className="w-16 p-1.5 bg-white border border-slate-300 rounded text-sm text-center font-medium focus:border-teal-500 outline-none focus:ring-1 focus:ring-teal-500"
                      value={config.numMC}
                      onChange={(e) => setConfig({...config, numMC: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-slate-600">Đúng / Sai</label>
                    <input 
                      type="number" min="0" max="10"
                      className="w-16 p-1.5 bg-white border border-slate-300 rounded text-sm text-center font-medium focus:border-teal-500 outline-none focus:ring-1 focus:ring-teal-500"
                      value={config.numTF}
                      onChange={(e) => setConfig({...config, numTF: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-slate-600">Trả lời ngắn</label>
                    <input 
                      type="number" min="0" max="20"
                      className="w-16 p-1.5 bg-white border border-slate-300 rounded text-sm text-center font-medium focus:border-teal-500 outline-none focus:ring-1 focus:ring-teal-500"
                      value={config.numShort}
                      onChange={(e) => setConfig({...config, numShort: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-slate-600">Tự luận</label>
                    <input 
                      type="number" min="0" max="10"
                      className="w-16 p-1.5 bg-white border border-slate-300 rounded text-sm text-center font-medium focus:border-teal-500 outline-none focus:ring-1 focus:ring-teal-500"
                      value={config.numEssay}
                      onChange={(e) => setConfig({...config, numEssay: parseInt(e.target.value) || 0})}
                    />
                  </div>
               </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={loading}
              className="w-full mt-4 flex justify-center items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={20} />
                  <span>Tạo đề ngay</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Main Content - Exam Paper */}
        <main className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 min-h-[800px] p-8 md:p-12 print:p-0 print:border-none print:shadow-none print:w-full font-serif">
          
          {/* Exam Header */}
          <div className="border-b-2 border-black mb-8 pb-4 text-center hidden print:block">
             <div className="flex justify-between items-start mb-6">
                <div className="text-center w-1/3">
                    <h3 className="font-bold text-sm uppercase m-0 leading-tight">SỞ GIÁO DỤC VÀ ĐÀO TẠO</h3>
                    <h3 className="font-bold text-sm uppercase m-0 leading-tight">................................</h3>
                    <div className="border-b border-black w-1/2 mx-auto mt-1 mb-1"></div>
                </div>
                <div className="text-center w-1/3">
                    <h3 className="font-bold text-sm uppercase m-0 leading-tight">ĐỀ KIỂM TRA MÔN TOÁN 9</h3>
                    <p className="italic text-sm m-0 mt-1">Năm học 2024 - 2025</p>
                    <p className="italic text-sm m-0">Thời gian làm bài: 90 phút</p>
                </div>
             </div>
             <div className="mt-4">
               <h1 className="text-2xl font-bold uppercase text-black m-0">ĐỀ KIỂM TRA ĐÁNH GIÁ ĐỊNH KỲ</h1>
               <p className="mt-1 text-black italic">(Đề thi gồm có {Math.ceil(examQuestions.length / 5) || 1} trang)</p>
             </div>
             {/* Student Info Box */}
             <div className="mt-6 flex text-left text-sm">
                <div className="w-1/2">Họ và tên thí sinh: ...........................................................</div>
                <div className="w-1/2">Số báo danh: ...................................................................</div>
             </div>
          </div>

          {/* Empty State */}
          {examQuestions.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 print:hidden py-20 font-sans">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                 <FileText size={40} className="text-slate-300" />
              </div>
              <p className="text-lg font-medium">Chưa có dữ liệu đề thi</p>
              <p className="text-sm text-center max-w-xs mt-1">
                {config.mode === 'file' 
                  ? "Hãy upload file đề mẫu (PDF) ở cột bên trái và nhấn 'Tạo đề ngay'" 
                  : "Hãy chọn chương và chủ đề ở cột bên trái và nhấn 'Tạo đề ngay'"}
              </p>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="space-y-12 animate-pulse py-10 font-sans">
              <div className="h-4 bg-slate-200 rounded w-1/4 mb-8"></div>
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-4">
                  <div className="flex gap-4">
                    <div className="h-4 bg-slate-200 rounded w-12 shrink-0"></div>
                    <div className="flex-1 space-y-3">
                       <div className="h-4 bg-slate-100 rounded w-full"></div>
                       <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                       <div className="grid grid-cols-4 gap-4 mt-4">
                          <div className="h-6 bg-slate-50 rounded w-full"></div>
                          <div className="h-6 bg-slate-50 rounded w-full"></div>
                          <div className="h-6 bg-slate-50 rounded w-full"></div>
                          <div className="h-6 bg-slate-50 rounded w-full"></div>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Questions Render */}
          {examQuestions.length > 0 && !loading && (
            <div>
              {renderQuestionsByType(QuestionType.MULTIPLE_CHOICE, "PHẦN I. TRẮC NGHIỆM NHIỀU LỰA CHỌN")}
              {renderQuestionsByType(QuestionType.TRUE_FALSE, "PHẦN II. TRẮC NGHIỆM ĐÚNG SAI")}
              {renderQuestionsByType(QuestionType.SHORT_ANSWER, "PHẦN III. TRẮC NGHIỆM TRẢ LỜI NGẮN")}
              {renderQuestionsByType(QuestionType.ESSAY, "PHẦN IV. TỰ LUẬN")}
              
              <div className="mt-16 pt-8 border-t border-slate-200 text-center text-sm text-black italic hidden print:block">
                 --- HẾT ---
                 <br />
                 <span className="text-xs not-italic">(Cán bộ coi thi không giải thích gì thêm)</span>
              </div>
            </div>
          )}
        </main>
      </div>
      
      {/* Floating Chat Box */}
      <ChatBox examQuestions={examQuestions} />
    </div>
  );
};

export default App;