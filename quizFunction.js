/**
 * FILE GỘP CÁC FUNCTION VÀ CLASS (quizFunction.js)
 * Tổng số file gộp: 15
 * Danh sách: F_fillSelectOptions.js, F_filterQuestionsAdvanced.js, F_generateSummaryText.js, F_getQuestionTimeInSeconds.js, F_getSelectedValues.js, F_handleAdvancedFilter_quizControllerObject.js, F_initQBank.js, F_nextQuestion.js, F_populateFilters.js, F_prevQuestion.js, F_renderCurrentQuestion_quizControllerObject.js, F_saveCurrentAnswer.js, F_startActualExam.js, F_submitExam.js, class_DualQuizTimer.js
 */

// ==========================================
// FILE: F_fillSelectOptions.js
// ==========================================
function fillSelectOptions(elementId, dataArray, defaultText, formatFn) {
    const selectElem = document.getElementById(elementId);
    if (!selectElem) return; // Nếu trang hiện tại không có thẻ select này thì bỏ qua, tránh lỗi console
    
    let optionsHtml = `<option value="all">${defaultText}</option>`;
    dataArray.forEach(item => {
        let text = formatFn ? formatFn(item) : item;
        optionsHtml += `<option value="${item}">${text}</option>`;
    });
    selectElem.innerHTML = optionsHtml;
}

// ==========================================
// FILE: F_filterQuestionsAdvanced.js
// ==========================================
// --- MODULE 002: BỘ LỌC ĐA CHIỀU (MULTI-COMBO FILTER) ---

/**
 * Hàm lọc nâng cao hỗ trợ chọn "đơn" hoặc "combo nhiều options"
 * @param {Array} questions - Mảng toàn bộ câu hỏi gốc
 * @param {Object} criteria - Đối tượng chứa các mảng giá trị cần lọc
 * Ví dụ criteria: {
 *   subjects: ['math', 'english'],
 *   grades: [3, 5],
 *   topics: ['algebra', 'geometry'],
 *   levels: [1, 3, 6, 9],
 *   types: ['w', 'mc']
 * }
 */
function filterQuestionsAdvanced(questions, criteria) {
    return questions.filter(q => {
        // 1. Lọc theo Môn học (Subject)
        // Nếu criteria.subjects rỗng hoặc chứa 'all' -> bỏ qua điều kiện lọc này
        if (criteria.subjects && criteria.subjects.length > 0 && !criteria.subjects.includes('all')) {
            if (!criteria.subjects.map(s => s.toLowerCase()).includes(String(q.subject).toLowerCase())) {
                return false; // Không khớp -> loại
            }
        }

        // 2. Lọc theo Khối lớp (Grade)
        if (criteria.grades && criteria.grades.length > 0 && !criteria.grades.includes('all')) {
            // Chuyển về kiểu số hoặc chuỗi để so sánh đồng bộ
            const qGrade = Number(q.grade);
            const validGrades = criteria.grades.map(Number);
            if (!validGrades.includes(qGrade)) {
                return false;
            }
        }

        // 3. Lọc theo Chủ đề (Topic)
        if (criteria.topics && criteria.topics.length > 0 && !criteria.topics.includes('all')) {
            if (!criteria.topics.map(t => t.toLowerCase()).includes(String(q.topic).toLowerCase())) {
                return false;
            }
        }

        // 4. Lọc theo Độ khó (Level) - Hỗ trợ combo nhiều level như [1, 3, 6, 9]
        if (criteria.levels && criteria.levels.length > 0 && !criteria.levels.includes('all')) {
            const qLevel = Number(q.level);
            const validLevels = criteria.levels.map(Number);
            if (!validLevels.includes(qLevel)) {
                return false;
            }
        }

        // 5. Lọc theo Loại câu hỏi (Type: w, mc, combo,...)
        if (criteria.types && criteria.types.length > 0 && !criteria.types.includes('all')) {
            if (!criteria.types.map(tp => tp.toLowerCase()).includes(String(q.type).toLowerCase())) {
                return false;
            }
        }

        // Nếu vượt qua tất cả các điều kiện trên -> Giữ lại câu hỏi
        return true;
    });
}

// ==========================================
// FILE: F_generateSummaryText.js
// ==========================================
//007 Hàm hiển thị lọc đc những câu hỏi ra sao
function generateSummaryText(quizList, criteria) {
    const totalCount = quizList.length;
    
    // Lấy danh sách các lớp duy nhất có trong kết quả
    const grades = [...new Set(quizList.map(q => q.grade))].sort((a, b) => a - b).join(' và ');
    
    // Lấy danh sách các level duy nhất
    const levels = [...new Set(quizList.map(q => q.level))].sort((a, b) => a - b).join(', ');
	
    // Lấy danh sách các topics
    const topics = [...new Set(quizList.map(q => q.topic))].sort((a, b) => a - b).join(', ');

	
    // Thống kê loại câu hỏi
    const hasW = quizList.some(q => !q.type || q.type === 'w');
    const hasMc = quizList.some(q => q.type === 'mc');
    let typeText = "Tự luận";
    if (hasW && hasMc) typeText = "trắc nghiệm và tự luận";
    else if (hasMc) typeText = "trắc nghiệm";

    return `Bạn đã chọn ${totalCount} câu gồm lớp ${grades} ở các chủ đề gồm ${topics} đã chọn ở mức độ level ${levels} ở kiểu thi ${typeText}. Hãy bắt đầu làm bài thôi !`;
}

// ==========================================
// FILE: F_getQuestionTimeInSeconds.js
// ==========================================
//006 modul
//006 Hàm Tính thời gian làm bài cho mỗi câu

function getQuestionTimeInSeconds(question) {
    const type = String(question.type || 'w').toLowerCase();
    const level = Number(question.level || 1);

    // Nếu là trắc nghiệm (mc)
    if (type === 'mc') {
        if (level <= 2) {
            return 90;   // 1p30s
        } else if (level <= 4) {
            return 120;  // 2p
        } else if (level <= 6) {
            return 150;  // 2p30s
        } else {
            return 180;  // 3p (Level 7 trở lên)
        }
    } 
    // Nếu là tự luận (w)
    else if (type === 'w') {
        if (level <= 2) {
            return 5 * 60;   // 5 phút
        } else if (level <= 4) {
            return 10 * 60;  // 10 phút
        } else if (level <= 6) {
            return 20 * 60;  // 20 phút
        } else {
            return 30 * 60;  // 30 phút (Level 7 trở lên)
        }
    }
    
    // Mặc định an toàn nếu type không xác định
    return 120; 
}

// ==========================================
// FILE: F_getSelectedValues.js
// ==========================================
//003 modul
// Hàm lấy tất cả giá trị đang được chọn từ một thẻ select nhiều lựa chọn
function getSelectedValues(selectElementId) {
    const selectElem = document.getElementById(selectElementId);
    if (!selectElem) return ['all'];

    const selectedOptions = Array.from(selectElem.selectedOptions);
    
    // Nếu không chọn gì hoặc chọn 'all'
    if (selectedOptions.length === 0 || selectedOptions.some(opt => opt.value === 'all')) {
        return ['all'];
    }

    // Trả về mảng các giá trị được chọn (Ví dụ: [3, 6, 1, 9])
    return selectedOptions.map(opt => opt.value);
}

// ==========================================
// FILE: F_handleAdvancedFilter_quizControllerObject.js
// ==========================================
//004 modul
function handleAdvancedFilter() {
    // Thu thập toàn bộ lựa chọn combo của học sinh
    const selectedCriteria = {
        subjects: getSelectedValues('subject-filter'),
        grades: getSelectedValues('grade-filter'),
        topics: getSelectedValues('topic-filter'),
        levels: getSelectedValues('level-filter'),
        types: getSelectedValues('type-filter') // Thêm mới trường type
    };

	// 1. Lọc ra TẤT CẢ các câu thỏa mãn điều kiện
    let matchedQuestions = filterQuestionsAdvanced(allQuestions, selectedCriteria);

    // 2. XÁO TRỘN VÀ GIỚI HẠN SỐ CÂU (Lấy từ Dashboard)
    if (desiredQuestionCount > 0 && matchedQuestions.length > desiredQuestionCount) {
        // Thuật toán xáo trộn ngẫu nhiên cơ bản (sẽ nâng cấp thuật toán đặc biệt sau theo ý bạn)
        matchedQuestions = matchedQuestions.sort(() => 0.5 - Math.random());
        // Chỉ cắt đúng số lượng câu học sinh muốn
        currentQuizList = matchedQuestions.slice(0, desiredQuestionCount);
    } else {
        currentQuizList = matchedQuestions; // Nếu số câu lọc được ít hơn yêu cầu thì lấy hết
    }
	
    const container = document.getElementById('quiz-container');
    if (!container) return;
    container.innerHTML = '';
	
    if (currentQuizList.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding: 20px; font-style: italic;">Không tìm thấy câu hỏi nào phù hợp với combo bạn chọn!</p>';
        return;
    }

    // Tạo câu thông báo tổng quan
    const summaryText = generateSummaryText(currentQuizList, selectedCriteria);

    // Hiển thị khung thông báo và nút "Bắt Đầu Làm Bài"
	container.innerHTML = `
    <div style="background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center;">
        <h2 style="color: #4338ca; margin-top: 0;">📋 Sẵn Sàng Làm Bài</h2>
        <p style="font-size: 16px; color: #374151; line-height: 1.6; margin: 20px 0;">${summaryText}</p>
        
        <!-- ĐÃ SỬA: Nút này giờ gọi qua QuizController -->
        <button onclick="QuizController.startExam()" style="background: #16a34a; color: white; border: none; padding: 12px 24px; font-size: 16px; font-weight: bold; border-radius: 6px; cursor: pointer;">🚀 Bắt Đầu Làm Bài</button>
    </div>
	`;
}

// ==========================================
// FILE: F_initQBank.js
// ==========================================
// --- MODULE 001: TẢI DỮ LIỆU & QUẢN LÝ BỘ LỌC ---
// Hàm khởi tạo chính (Dùng để gọi ở các trang web khác nhau)
function initQBank(jsonFile = 'qbank_data.json', callback) {
    fetch(jsonFile)
        .then(response => {
            if (!response.ok) throw new Error(`Không thể tải file ${jsonFile} (HTTP: ${response.status})`);
            return response.json();
        })
        .then(data => {
            allQuestions = data;
            console.log(`Đã tải thành công ${allQuestions.length} câu hỏi từ ${jsonFile}`);
            populateFilters();
            
            // Nếu có truyền thêm hàm callback (ví dụ hàm loadQuestions sau khi load xong data), thì chạy nó
            if (typeof callback === 'function') callback(allQuestions);
        })
        .catch(error => {
            console.error("Lỗi tải JSON:", error);
            const container = document.getElementById('quiz-container');
            if (container) {
                container.innerHTML = `<p style="text-align:center; color:red;">Lỗi tải dữ liệu: ${error.message}</p>`;
            }
        });
}

// ==========================================
// FILE: F_nextQuestion.js
// ==========================================
// 4. Hàm chuyển sang câu tiếp theo
function nextQuestion() {
    if (currentQuestionIndex < currentQuizList.length - 1) {
        currentQuestionIndex++;
        renderCurrentQuestion();
    }
}

// ==========================================
// FILE: F_populateFilters.js
// ==========================================
function populateFilters() {
    if (!allQuestions.length) return;

    const subjects = [...new Set(allQuestions.map(q => q.subject).filter(Boolean))];
    const grades = [...new Set(allQuestions.map(q => q.grade).filter(Boolean))].sort((a, b) => a - b);
    const topics = [...new Set(allQuestions.map(q => q.topic).filter(Boolean))];
    const levels = [...new Set(allQuestions.map(q => q.level).filter(Boolean))].sort((a, b) => a - b);

    fillSelectOptions('subject-filter', subjects, 'Tất cả môn học', (val) => {
        return SUBJECT_MAP[String(val).toLowerCase()] || val;
    });
    
    fillSelectOptions('grade-filter', grades, 'Tất cả lớp', (val) => `Lớp ${val}`);
    fillSelectOptions('topic-filter', topics, 'Tất cả chủ đề');
    fillSelectOptions('level-filter', levels, 'Tất cả độ khó', (val) => `Level ${val}`);
}

// ==========================================
// FILE: F_prevQuestion.js
// ==========================================
// 5. Hàm quay lại câu trước
function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderCurrentQuestion();
    }
}

// ==========================================
// FILE: F_renderCurrentQuestion_quizControllerObject.js
// ==========================================
// ==========================================
// FILE: F_renderCurrentQuestion.js (Thay thế hàm cũ)
// ==========================================
function renderCurrentQuestion() {
    const container = document.getElementById('quiz-container');
    if (!container) return;

    const q = currentQuizList[currentQuestionIndex];
    const totalQuestions = currentQuizList.length;
    const savedAnswer = studentAnswers[q.id] || '';
	const rawSubject = String(q.subject || '').toLowerCase();
	const displaySubject = SUBJECT_MAP[rawSubject] || q.subject || 'N/A';
	
	// --- XỬ LÝ PHẦN MEDIA ---
    let mediaHtml = '<div class="media-container" style="margin: 15px 0;">';
	// (Đoạn mã if (q.media)... của bạn xử lý Ảnh/Video/Audio giữ nguyên như cũ, tôi rút gọn để dễ nhìn)
    if (q.media && Array.isArray(q.media) && q.media.length > 0) {
        q.media.forEach(m => {
            if (m.type === 'image') mediaHtml += `<img src="${m.url}" alt="Question Image" loading="lazy" style="max-width: 100%; height: auto; border-radius: 6px; display: block; margin-top: 10px;">`;
            else if (m.type === 'audio') mediaHtml += `<audio controls style="width: 100%; margin-top: 10px;"><source src="${m.url}" type="audio/mpeg"></audio>`;
            else if (m.type === 'video') mediaHtml += `<video controls style="width: 100%; margin-top: 10px; border-radius: 6px;"><source src="${m.url}" type="video/mp4"></video>`;
            else if (m.type === 'iframe') mediaHtml += `<iframe src="${m.url}" style="width: 100%; aspect-ratio: 16/9; margin-top: 10px; border: none; border-radius: 8px;" allowfullscreen></iframe>`;
        });
    }
    mediaHtml += '</div>';

    // --- TẠO BẢNG ĐIỀU HƯỚNG CÂU HỎI ---
    let navHtml = '<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; padding: 15px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">';
    navHtml += '<div style="width: 100%; font-size: 13px; font-weight: bold; color: #4b5563; margin-bottom: 5px;">Bảng điều hướng:</div>';
    
    currentQuizList.forEach((qItem, i) => {
        let isCurrent = (i === currentQuestionIndex);
        let hasAnswered = (studentAnswers[qItem.id] && studentAnswers[qItem.id].trim() !== ''); // Đã nhập chữ
        
        let bgColor = '#e5e7eb'; let textColor = '#374151'; let border = '1px solid #d1d5db';
        if (isCurrent) { bgColor = '#3b82f6'; textColor = '#ffffff'; border = '1px solid #2563eb'; } // Câu hiện tại: Màu Xanh Dương
        else if (hasAnswered) { bgColor = '#10b981'; textColor = '#ffffff'; border = '1px solid #059669'; } // Đã làm: Xanh lá

        navHtml += `<button class="nav-jump-btn" onclick="QuizController.jumpTo(${i})" style="width: 35px; height: 35px; border-radius: 4px; cursor: pointer; font-weight: bold; background: ${bgColor}; color: ${textColor}; border: ${border}; transition: 0.2s;">${i + 1}</button>`;
    });
    navHtml += '</div>';
    // -----------------------------------
	
    // Xây dựng giao diện hiển thị hoàn chỉnh
    container.innerHTML = `
        <div style="background: #ffffff; padding: 25px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 15px;">
                <span style="font-weight: bold; color: #4338ca; font-size: 16px;">Câu ${currentQuestionIndex + 1} / ${totalQuestions}</span>
                <div style="display: flex; gap: 10px;">
                    <span id="global-timer-display" style="font-weight: bold; color: #16a34a; font-size: 14px; background: #dcfce7; padding: 4px 10px; border-radius: 4px;">Tổng: Đang tải...</span>
                    <span id="question-timer-display" style="font-weight: bold; color: #dc2626; font-size: 14px; background: #fee2e2; padding: 4px 10px; border-radius: 4px;">Câu: Đang tải...</span>
                </div>
            </div>

            <!-- CHÈN BẢNG ĐIỀU HƯỚNG VÀO ĐÂY -->
            ${navHtml}

            <div style="margin-bottom: 12px;">
                <span style="background:#eef2ff; color:#4338ca; padding:3px 6px; border-radius:4px; font-weight:bold; font-size:11px; margin-right:4px;">Môn: ${displaySubject}</span>
                <span style="background:#ecfdf5; color:#065f46; padding:3px 6px; border-radius:4px; font-weight:bold; font-size:11px; margin-right:4px;">Lớp ${q.grade || '?'}</span>
                <span style="background:#fef3c7; color:#92400e; padding:3px 6px; border-radius:4px; font-weight:bold; font-size:11px; margin-right:4px;">Level ${q.level}</span>
				<span style="background:#e5e7eb; color:#1f2937; padding:3px 6px; border-radius:4px; font-family: monospace; font-size:11px;">qID ${q.id}</span>
                <span style="background:#f3f4f6; color:#374151; padding:3px 6px; border-radius:4px; font-size:11px;">Loại: ${q.type || 'Tự Luận'}</span>
            </div>

            <p style="font-size: 16px; font-weight: 500; color: #1f2937; line-height: 1.5;">${q.content}</p>

            ${mediaHtml}

            <div style="margin-top: 20px;">
                <textarea id="student-answer-input" oninput="QuizController.saveInput('${q.id}')" placeholder="Nhập câu trả lời của bạn vào đây..." style="width: 100%; height: 120px; padding: 10px; border-radius: 6px; border: 1px solid #d1d5db; font-size: 14px; box-sizing: border-box;">${savedAnswer}</textarea>
            </div>

            <div style="margin-top: 10px;">
                <button onclick="toggleHint('hint_${q.id}')" style="background: #f3f4f6; border: 1px solid #d1d5db; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px;">💡 Xem Gợi ý Giải</button>
                <div id="hint_${q.id}" style="display: none; margin-top: 8px; padding: 10px; background: #f9fafb; border-left: 4px solid #3b82f6; border-radius: 4px; font-size: 14px; color: #4b5563;">
                    <strong>💡 Gợi ý:</strong> ${q.hint ? q.hint : 'Giáo viên chưa cập nhật gợi ý cho câu này.'}
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 25px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
                <button onclick="QuizController.goPrev()" style="background: ${currentQuestionIndex === 0 ? '#9ca3af' : '#4b5563'}; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: ${currentQuestionIndex === 0 ? 'not-allowed' : 'pointer'};" ${currentQuestionIndex === 0 ? 'disabled' : ''}>⬅️ Câu trước</button>
                <button onclick="QuizController.submit()" style="background: #dc2626; color: white; border: none; padding: 8px 20px; font-weight: bold; border-radius: 4px; cursor: pointer;">📥 Nộp Bài</button>
                <button onclick="QuizController.goNext()" style="background: ${currentQuestionIndex === totalQuestions - 1 ? '#9ca3af' : '#2563eb'}; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: ${currentQuestionIndex === totalQuestions - 1 ? 'not-allowed' : 'pointer'};" ${currentQuestionIndex === totalQuestions - 1 ? 'disabled' : ''}>Câu sau ➡️</button>
            </div>
        </div>
    `;	
}

// ==========================================
// FILE: F_saveCurrentAnswer.js
// ==========================================
// 3. Hàm lưu lại đáp án học sinh gõ ngay lập tức vào biến toàn cục studentAnswers
function saveCurrentAnswer(questionId) {
    const inputElem = document.getElementById('student-answer-input');
    if (inputElem) {
        studentAnswers[questionId] = inputElem.value;
    }
}

// ==========================================
// FILE: F_startActualExam.js
// ==========================================
//008 chuỗi sự kiện startExam
// 1. Hàm bắt đầu kỳ thi / làm bài chi tiết

function startActualExam() {
    if (!currentQuizList || currentQuizList.length === 0) return;
    
    currentQuestionIndex = 0; // Luôn bắt đầu từ câu đầu tiên (index = 0)
    
    // Hiển thị khung giao diện làm bài chính thức lên màn hình
    renderCurrentQuestion();
}

// ==========================================
// FILE: F_submitExam.js
// ==========================================
// ==========================================
// FILE: F_submitExam.js (Thay thế hàm cũ)
// ==========================================
function submitExam(isAutoSubmit = false) {
    // Đếm số câu có trả lời khác rỗng
    let totalAnswered = 0;
    Object.values(studentAnswers).forEach(val => { if (val.trim() !== '') totalAnswered++; });
    
    if (!isAutoSubmit) {
        if (!confirm(`Bạn có chắc chắn muốn nộp bài không? Bạn đã trả lời được ${totalAnswered}/${currentQuizList.length} câu.`)) {
            return; 
        }
    }

    const answerInput = document.getElementById('student-answer-input');
    if (answerInput) {
        answerInput.disabled = true;
        answerInput.style.backgroundColor = '#f3f4f6';
        answerInput.style.cursor = 'not-allowed';
    }

    // Khóa luôn cả Bảng điều hướng vì nó nằm trong quiz-container
    const allButtons = document.querySelectorAll('#quiz-container button');
    allButtons.forEach(btn => {
        btn.disabled = true;
        btn.style.cursor = 'not-allowed';
        
        if (btn.textContent.includes('Nộp Bài')) {
            btn.textContent = '✅ Đã nộp bài';
            btn.style.backgroundColor = '#9ca3af'; 
        } else {
            btn.style.opacity = '0.5';
        }
    });

    if (!isAutoSubmit) {
        alert("Đã nộp bài thành công! Hệ thống đã khóa toàn bộ thao tác.");
    }

    // SAU 2 GIÂY -> HIỆN NÚT VỀ TRANG CHỦ
    setTimeout(() => {
        const container = document.getElementById('quiz-container');
        if (container) {
            const homeBtnHtml = `
                <div style="text-align: center; margin-top: 30px;">
                    <button onclick="window.location.href='index.html'" style="background: #4338ca; color: white; border: none; padding: 12px 30px; font-size: 16px; font-weight: bold; border-radius: 6px; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">🏠 Trở về Trang Chủ</button>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', homeBtnHtml);
        }
    }, 2000);
}

// ==========================================
// FILE: class_DualQuizTimer.js
// ==========================================
/**
 * DualQuizTimer Module - Có chức năng ghi nhớ thời gian dở dang của từng câu
 */
class DualQuizTimer {
    constructor(options) {
        this.globalSeconds = options.globalSeconds || 1800; 
        this.onGlobalTick = options.onGlobalTick || (() => {});
        this.onQuestionTick = options.onQuestionTick || (() => {});
        this.onGlobalTimeUp = options.onGlobalTimeUp || (() => {});
        this.onQuestionTimeUp = options.onQuestionTimeUp || (() => {});

        this.globalEndTime = null;
        this.questionEndTime = null;
        this.currentQuestionSeconds = 60;
        this.timerInterval = null;
        
        this.storageKeyGlobal = 'quiz_global_end_time';
        
        // ĐÃ THÊM: Object lưu lại thời gian dư của các câu đã làm
        this.questionTimes = {}; 
        this.currentQuestionId = null;
    }

    start() {
        const now = Date.now();
        const savedGlobal = localStorage.getItem(this.storageKeyGlobal);
        
        if (savedGlobal && parseInt(savedGlobal, 10) > now) {
            this.globalEndTime = parseInt(savedGlobal, 10);
        } else {
            this.globalEndTime = now + (this.globalSeconds * 1000);
            localStorage.setItem(this.storageKeyGlobal, this.globalEndTime);
        }

        this.timerInterval = setInterval(() => {
            this.tick();
        }, 1000);
    }

    loadQuestion(question) {
        // 1. LƯU THỜI GIAN CÒN LẠI CỦA CÂU CŨ (trước khi chuyển sang câu mới)
        if (this.currentQuestionId && this.questionEndTime) {
            const remaining = Math.max(0, Math.floor((this.questionEndTime - Date.now()) / 1000));
            this.questionTimes[this.currentQuestionId] = remaining;
        }

        // 2. CHUYỂN SANG CÂU MỚI
        this.currentQuestionId = question.id;

        // 3. KIỂM TRA LỊCH SỬ THỜI GIAN CỦA CÂU MỚI
        if (this.questionTimes[question.id] !== undefined) {
            // Nếu đã từng làm, lấy thời gian cũ còn dư ráp vào
            this.currentQuestionSeconds = this.questionTimes[question.id];
        } else {
            // Nếu là lần đầu tiên mở câu này, cấp full thời gian
            if (typeof getQuestionTimeInSeconds === 'function') {
                this.currentQuestionSeconds = getQuestionTimeInSeconds(question);
            } else {
                this.currentQuestionSeconds = 120; 
            }
        }
        
        // Cài đặt lại mốc hết giờ
        this.questionEndTime = Date.now() + (this.currentQuestionSeconds * 1000);
    }

    tick() {
        const now = Date.now();

        // Đồng hồ tổng
        const globalRemainingMs = this.globalEndTime - now;
        const globalRemainingSec = Math.max(0, Math.floor(globalRemainingMs / 1000));
        this.onGlobalTick(globalRemainingSec, this.formatTime(globalRemainingSec));

        if (globalRemainingSec <= 0) {
            this.stop();
            localStorage.removeItem(this.storageKeyGlobal);
            this.onGlobalTimeUp();
            return;
        }

        // Đồng hồ câu hỏi hiện tại
        if (this.questionEndTime) {
            const qRemainingMs = this.questionEndTime - now;
            const qRemainingSec = Math.max(0, Math.floor(qRemainingMs / 1000));
            this.onQuestionTick(qRemainingSec, this.formatTime(qRemainingSec));

            if (qRemainingSec <= 0) {
                // ĐÃ THÊM: Reset để tránh bị báo alert liên tục nhiều lần
                this.questionEndTime = null; 
                this.onQuestionTimeUp();
            }
        }
    }

    formatTime(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const pad = (num) => String(num).padStart(2, '0');

        if (hours > 0) {
            return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
        }
        return `${pad(minutes)}:${pad(seconds)}`;
    }

    stop() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        localStorage.removeItem(this.storageKeyGlobal);
    }
}

