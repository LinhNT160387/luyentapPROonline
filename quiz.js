// BƯỚC 1: HỆ THỐNG KHỞI ĐỘNG KHI TẢI TRANG
document.addEventListener("DOMContentLoaded", () => {
    // Gọi hàm khởi tạo để tải JSON và sinh bộ lọc
    initQBank('qbank_data.json', (data) => {
        console.log("Hệ thống đã sẵn sàng cho học sinh tương tác!");
    });
});

const QuizController = {
    startExam: function() {
        console.log("Đang bắt đầu kỳ thi...");
        
        // Ẩn thanh bộ lọc đi để học sinh tập trung làm bài
        const filterSection = document.getElementById('filter-section');
        if (filterSection) {
            filterSection.style.display = 'none'; 
        }
        
        // TÍNH TỔNG THỜI GIAN ĐỘNG (Dựa trên số câu lọc được)
        let totalExamSeconds = 0;
        currentQuizList.forEach(q => {
            totalExamSeconds += (typeof getQuestionTimeInSeconds === 'function') 
                                ? getQuestionTimeInSeconds(q) 
                                : 120;
        });

        // 1. Khởi tạo Dual Timer với tổng thời gian tính toán được
        myQuizTimer = new DualQuizTimer({
            globalSeconds: totalExamSeconds, 
            
            onGlobalTick: (remainingSec, formattedTime) => {
                const el = document.getElementById('global-timer-display');
                if (el) el.textContent = `⏳ Tổng: ${formattedTime}`;
            },
            
            onQuestionTick: (remainingSec, formattedTime) => {
                const el = document.getElementById('question-timer-display');
                if (el) el.textContent = `⏱ Câu: ${formattedTime}`;
            },
            
            onGlobalTimeUp: () => {
                alert("ĐÃ HẾT GIỜ LÀM BÀI! Hệ thống tự động nộp bài và khóa thao tác.");
                this.submit(true); 
            },
            
            onQuestionTimeUp: () => {
                alert("Đã hết thời gian cho câu hỏi này!");
                this.goNext();
            }
        });

        // 2. Bắt đầu đếm tổng
        myQuizTimer.start();
        
        // 3. Render giao diện và load thời gian câu đầu tiên
        startActualExam(); 
        myQuizTimer.loadQuestion(currentQuizList[currentQuestionIndex]);
    },

    // THÊM MỚI: Hàm nhảy cóc tới câu hỏi cụ thể từ bảng điều hướng
    jumpTo: function(index) {
        if (index >= 0 && index < currentQuizList.length) {
            currentQuestionIndex = index;
            renderCurrentQuestion();
            myQuizTimer.loadQuestion(currentQuizList[currentQuestionIndex]);
        }
    },

    goNext: function() {
        if (currentQuestionIndex < currentQuizList.length - 1) {
            currentQuestionIndex++; 
            renderCurrentQuestion();
            myQuizTimer.loadQuestion(currentQuizList[currentQuestionIndex]);
        }
    },

    goPrev: function() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            renderCurrentQuestion();
            myQuizTimer.loadQuestion(currentQuizList[currentQuestionIndex]);
        }
    },

    saveInput: function(questionId) {
        saveCurrentAnswer(questionId);
    },

    submit: function(isAutoSubmit = false) {
        if (myQuizTimer) myQuizTimer.stop(); 
        submitExam(isAutoSubmit);
    }
};