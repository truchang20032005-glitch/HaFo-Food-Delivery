import Swal from 'sweetalert2';
import './hafoAlert.css';

// Cấu hình chung cho toàn bộ App HaFo
const HaFoAlert = Swal.mixin({
    confirmButtonColor: '#F97350',
    cancelButtonColor: '#94A3B8',
    // Tự động điều chỉnh chiều rộng: 95% trên mobile, 32rem trên desktop
    width: window.innerWidth < 480 ? '95%' : '32rem',
    customClass: {
        popup: 'hafo-swal-popup',
        confirmButton: 'hafo-swal-confirm',
        title: 'hafo-swal-title'
    },
    buttonsStyling: true
});

export const alertSuccess = (title, text = "") => {
    return HaFoAlert.fire({
        icon: 'success',
        iconColor: '#F97350',
        title,
        text,
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false
    });
};

export const alertError = (title, text = "") => {
    return HaFoAlert.fire({
        icon: 'error',
        title,
        text,
        confirmButtonText: 'Thử lại'
    });
};

// Đây nè, bản Warning đã được thêm vào:
export const alertWarning = (title, text = "") => {
    return HaFoAlert.fire({
        icon: 'warning',
        title,
        text,
        confirmButtonText: 'Đã hiểu',
        showClass: {
            popup: 'animate__animated animate__shakeX'
        }
    });
};

export const alertInfo = (title, text = "") => {
    return HaFoAlert.fire({
        icon: 'info',
        iconColor: '#3FC3EE', // Màu xanh dương dịu cho thông tin thông thường
        title,
        text,
        confirmButtonText: 'Đã hiểu',
        // Hiệu ứng hiện ra nhẹ nhàng, không rung như bản Warning
        showClass: {
            popup: 'animate__animated animate__fadeInDown'
        }
    });
};

export const confirmDialog = async (title, text = "", confirmText = 'Đồng ý') => {
    const result = await HaFoAlert.fire({
        title,
        text,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: 'Hủy',
        reverseButtons: true
    });
    return result.isConfirmed;
};