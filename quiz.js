//Khai Báo Biến toàn cục

let allQuestions = [];
let currentQuestionIndex = 0; //Đang ở câu số mấy, bắt đầu từ 0
let studentAnswers = {}; //Lưu lại các đáp án học sinh đã gõ/chọn để khi bấm "Câu trước" quay lại không bị mất chữ)
let currentQuizList = []; // <-- BỔ SUNG BIẾN NÀY ĐỂ LƯU KẾT QUẢ LỌC
let timerInterval = null; // Biến lưu luồng đếm ngược của đồng hồ
let examTimeLeft = 0;   // Thời gian còn lại của câu hiện tại (tính bằng giây)

// Từ điển dịch môn học (Có thể thêm bớt tùy dự án)
const SUBJECT_MAP = {
    'math': 'Toán', 'physics': 'Vật lý', 'chemistry': 'Hóa học',
    'biology': 'Sinh học', 'literature': 'Văn học', 'vietnamese': 'Tiếng Việt',
    'history': 'Lịch Sử', 'geography': 'Địa lý', 'english': 'Tiếng Anh',
    'japanese': 'Tiếng Nhật', 'it': 'Tin học'
};
// 2. KÍCH HOẠT FLOW KHI TRANG VỪA TẢI XONG
document.addEventListener("DOMContentLoaded", () => {
    // Gọi hàm khởi tạo từ Module 001 để tải JSON và sinh bộ lọc
    initQBank('qbank_data.json', (data) => {
        console.log("Hệ thống đã sẵn sàng cho học sinh tương tác!");
    });
});

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

    // Thực hiện lọc từ mảng gốc allQuestions (lấy từ module 001)
    currentQuizList = filterQuestionsAdvanced(allQuestions, selectedCriteria);
	
	const container = document.getElementById('quiz-container');
    if (!container) return;
    container.innerHTML = ''; 

    if (currentQuizList.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding: 20px; font-style: italic;">Không tìm thấy câu hỏi nào phù hợp với combo bạn chọn!</p>';
        return;
    }

    // Tạo câu thông báo tổng quan sử dụng hàm generateSummaryText của bạn
    const summaryText = generateSummaryText(currentQuizList, selectedCriteria);

    // Hiển thị khung thông báo và nút "Bắt Đầu Làm Bài"
	container.innerHTML = `
    <div style="background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center;">
        <h2 style="color: #4338ca; margin-top: 0;">📋 Sẵn Sàng Làm Bài</h2>
        <p style="font-size: 16px; color: #374151; line-height: 1.6; margin: 20px 0;">${summaryText}</p>
        <!-- Nút này gọi thẳng hàm startActualExam chính thức ở phía dưới -->
        <button onclick="startActualExam()" style="background: #16a34a; color: white; border: none; padding: 12px 24px; font-size: 16px; font-weight: bold; border-radius: 6px; cursor: pointer;">🚀 Bắt Đầu Làm Bài</button>
    </div>
	`;
}

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
//008 chuỗi sự kiện startExam
// 1. Hàm bắt đầu kỳ thi / làm bài chi tiết

function startActualExam() {
    if (!currentQuizList || currentQuizList.length === 0) return;
    
    currentQuestionIndex = 0; // Luôn bắt đầu từ câu đầu tiên (index = 0)
    
    // Hiển thị khung giao diện làm bài chính thức lên màn hình
    renderCurrentQuestion();
}

// 2. Hàm render một câu hỏi duy nhất tại vị trí currentQuestionIndex
function renderCurrentQuestion() {
    const container = document.getElementById('quiz-container');
    if (!container) return;

    // Lấy thông tin câu hỏi hiện tại từ mảng combo đã lọc
    const q = currentQuizList[currentQuestionIndex];
    const totalQuestions = currentQuizList.length;

    // Lấy nội dung học sinh đã làm trước đó (nếu có bấm quay lại câu trước)
    const savedAnswer = studentAnswers[q.id] || '';
	
	// Lấy tên môn tiếng Việt từ từ điển SUBJECT_MAP
	const rawSubject = String(q.subject || '').toLowerCase();
	const displaySubject = SUBJECT_MAP[rawSubject] || q.subject || 'N/A';
	
    // Xây dựng giao diện hiển thị
    container.innerHTML = `
        <div style="background: #ffffff; padding: 25px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            
            <!-- Thanh thông tin trên cùng: Số câu & Đồng hồ đếm ngược -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 15px;">
                <span style="font-weight: bold; color: #4338ca; font-size: 16px;">
                    Câu ${currentQuestionIndex + 1} / ${totalQuestions}
                </span>
                <span id="exam-timer-display" style="font-weight: bold; color: #dc2626; font-size: 15px; background: #fee2e2; padding: 4px 10px; border-radius: 4px;">
                    ⏱ Đang tải giờ...
                </span>
            </div>

            <!-- Nhãn thông tin chi tiết câu hỏi -->
            <div style="margin-bottom: 12px;">
                <span style="background:#eef2ff; color:#4338ca; padding:3px 6px; border-radius:4px; font-weight:bold; font-size:11px; margin-right:4px;">Môn: ${displaySubject}</span>
                <span style="background:#ecfdf5; color:#065f46; padding:3px 6px; border-radius:4px; font-weight:bold; font-size:11px; margin-right:4px;">Lớp ${q.grade || '?'}</span>
                <span style="background:#fef3c7; color:#92400e; padding:3px 6px; border-radius:4px; font-weight:bold; font-size:11px; margin-right:4px;">Level ${q.level}</span>
				<span style="background:#e5e7eb; color:#1f2937; padding:3px 6px; border-radius:4px; font-family: monospace; font-size:11px;">qID ${q.id}</span>
                <span style="background:#f3f4f6; color:#374151; padding:3px 6px; border-radius:4px; font-size:11px;">Loại: ${q.type || 'Tự Luận'}</span>
            </div>

            <!-- Nội dung câu hỏi -->
            <p style="font-size: 16px; font-weight: 500; color: #1f2937; line-height: 1.5;">${q.content}</p>

            <!-- Khu vực làm bài (Nhập đáp án tự luận hoặc chọn trắc nghiệm) -->
            <div style="margin-top: 20px;">
                <textarea id="student-answer-input" oninput="saveCurrentAnswer('${q.id}')" placeholder="Nhập câu trả lời của bạn vào đây..." style="width: 100%; height: 120px; padding: 10px; border-radius: 6px; border: 1px solid #d1d5db; font-size: 14px; box-sizing: border-box;">${savedAnswer}</textarea>
            </div>

            <!-- Nút Xem Gợi ý và hiển thị q.hint chuẩn xác -->
            <div style="margin-top: 10px;">
                <button onclick="toggleHint('hint_${q.id}')" style="background: #f3f4f6; border: 1px solid #d1d5db; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px;">💡 Xem Gợi ý Giải</button>
                <div id="hint_${q.id}" style="display: none; margin-top: 8px; padding: 10px; background: #f9fafb; border-left: 4px solid #3b82f6; border-radius: 4px; font-size: 14px; color: #4b5563;">
                    <strong>💡 Gợi ý:</strong> ${q.hint ? q.hint : 'Giáo viên chưa cập nhật gợi ý cho câu này.'}
                </div>
            </div>

            <!-- Thanh điều hướng: Nút Câu trước, Câu sau, Nộp bài -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 25px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
                <button onclick="prevQuestion()" style="background: ${currentQuestionIndex === 0 ? '#9ca3af' : '#4b5563'}; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: ${currentQuestionIndex === 0 ? 'not-allowed' : 'pointer'};" ${currentQuestionIndex === 0 ? 'disabled' : ''}>⬅️ Câu trước</button>
                
                <!-- Nút Nộp Bài đặc biệt -->
                <button onclick="submitExam()" style="background: #dc2626; color: white; border: none; padding: 8px 20px; font-weight: bold; border-radius: 4px; cursor: pointer;">📥 Nộp Bài</button>

                <button onclick="nextQuestion()" style="background: ${currentQuestionIndex === totalQuestions - 1 ? '#9ca3af' : '#2563eb'}; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: ${currentQuestionIndex === totalQuestions - 1 ? 'not-allowed' : 'pointer'};" ${currentQuestionIndex === totalQuestions - 1 ? 'disabled' : ''}>Câu sau ➡️</button>
            </div>

        </div>
    `;
	// Tính thời gian và kích hoạt đồng hồ bằng setTimeout để tránh lỗi DOM chưa render kịp
    examTimeLeft = getQuestionTimeInSeconds(q);
    setTimeout(() => {
        startQuestionTimer();
    }, 50);
}

// 3. Hàm lưu lại đáp án học sinh gõ ngay lập tức vào biến toàn cục studentAnswers
function saveCurrentAnswer(questionId) {
    const inputElem = document.getElementById('student-answer-input');
    if (inputElem) {
        studentAnswers[questionId] = inputElem.value;
    }
}

// 4. Hàm chuyển sang câu tiếp theo
function nextQuestion() {
    if (currentQuestionIndex < currentQuizList.length - 1) {
        stopTimer(); // Dừng đồng hồ câu cũ
        currentQuestionIndex++;
        renderCurrentQuestion();
    }
}

// 5. Hàm quay lại câu trước
function prevQuestion() {
    if (currentQuestionIndex > 0) {
        stopTimer(); // Dừng đồng hồ câu cũ
        currentQuestionIndex--;
        renderCurrentQuestion();
    }
}

// 6. Đồng hồ đếm ngược riêng cho từng câu hỏi
function startQuestionTimer() {
    stopTimer();
    const timerDisplay = document.getElementById('exam-timer-display');
    if (!timerDisplay) return;

    timerInterval = setInterval(() => {
        if (examTimeLeft <= 0) {
            clearInterval(timerInterval);
            alert("Đã hết thời gian cho câu hỏi này! Hệ thống tự động chuyển câu.");
            nextQuestion(); // Hết giờ tự động sang câu sau
            return;
        }
        examTimeLeft--;

        const minutes = Math.floor(examTimeLeft / 60);
        const seconds = examTimeLeft % 60;
        timerDisplay.textContent = `⏱ Thời gian câu này: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// 7. Hàm dừng đồng hồ
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// 8. Hàm Nộp bài (Tạm thời thông báo, sau này sẽ tích hợp sheet.js)
function submitExam() {
    stopTimer();
    const totalAnswered = Object.keys(studentAnswers).length;
    if (confirm(`Bạn có chắc chắn muốn nộp bài không? Bạn đã trả lời được ${totalAnswered}/${currentQuizList.length} câu.`)) {
        alert("Đã nộp bài thành công! (Chức năng gửi Google Sheet sẽ được tích hợp ở module sau).");
        // Ở đây sau này sẽ hiện nút về trang chủ hoặc đăng xuất
    }
}
	
//005 modul
// --- BƯỚC HOÀN THIỆN: HÀM RENDER GIAO DIỆN VÀ KÍCH HOẠT FLOW ---

