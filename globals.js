// Khai Báo Biến toàn cục (Thêm 2 dòng này vào đầu file)
let currentUser = sessionStorage.getItem('currentUser') || 'Học sinh Ẩn danh';
let desiredQuestionCount = parseInt(sessionStorage.getItem('quizLimit')) || 10; // 0 nghĩa là không giới hạn
let allQuestions = [];
let currentQuestionIndex = 0; //Đang ở câu số mấy, bắt đầu từ 0
let studentAnswers = {}; //Lưu lại các đáp án học sinh đã gõ/chọn để khi bấm "Câu trước" quay lại không bị mất chữ)
let currentQuizList = []; // <-- BỔ SUNG BIẾN NÀY ĐỂ LƯU KẾT QUẢ LỌC
let myQuizTimer = null; // Khai báo biến lưu trữ bộ đếm giờ

// Từ điển dịch môn học (Có thể thêm bớt tùy dự án)
const SUBJECT_MAP = {
    'math': 'Toán', 'physics': 'Vật lý', 'chemistry': 'Hóa học',
    'biology': 'Sinh học', 'literature': 'Văn học', 'vietnamese': 'Tiếng Việt',
    'history': 'Lịch Sử', 'geography': 'Địa lý', 'english': 'Tiếng Anh',
    'japanese': 'Tiếng Nhật', 'it': 'Tin học'
};
