import { Chapter, DifficultyLevel } from "./types";

export const DIFFICULTIES = [
  DifficultyLevel.EASY,
  DifficultyLevel.MEDIUM,
  DifficultyLevel.HARD,
  DifficultyLevel.EXPERT
];

export const DEFAULT_CONFIG = {
  numMC: 12,
  numTF: 2,
  numShort: 4,
  numEssay: 4
};

export const CURRICULUM_DATA: Chapter[] = [
  {
    id: "c1",
    name: "Chương 1: Phương trình và Hệ phương trình",
    topics: [
      { id: "c1_t1", name: "Phương trình quy về phương trình bậc nhất một ẩn" },
      { id: "c1_t2", name: "Phương trình bậc nhất hai ẩn và hệ hai phương trình bậc nhất hai ẩn" },
      { id: "c1_t3", name: "Giải hệ hai phương trình bậc nhất hai ẩn" }
    ]
  },
  {
    id: "c2",
    name: "Chương 2: Bất đẳng thức. Bất phương trình bậc nhất một ẩn",
    topics: [
      { id: "c2_t1", name: "Bất đẳng thức" },
      { id: "c2_t2", name: "Bất phương trình bậc nhất một ẩn" }
    ]
  },
  {
    id: "c3",
    name: "Chương 3: Căn thức",
    topics: [
      { id: "c3_t1", name: "Căn bậc hai" },
      { id: "c3_t2", name: "Căn bậc ba" },
      { id: "c3_t3", name: "Tính chất của phép khai phương" },
      { id: "c3_t4", name: "Biến đổi đơn giản biểu thức chứa căn thức bậc hai" }
    ]
  },
  {
    id: "c4",
    name: "Chương 4: Hệ thức lượng trong tam giác vuông",
    topics: [
      { id: "c4_t1", name: "Tỉ số lượng giác của góc nhọn" },
      { id: "c4_t2", name: "Hệ thức giữa cạnh và góc của tam giác vuông" }
    ]
  },
  {
    id: "c5",
    name: "Chương 5: Đường tròn",
    topics: [
      { id: "c5_t1", name: "Đường tròn" },
      { id: "c5_t2", name: "Tiếp tuyến của đường tròn" },
      { id: "c5_t3", name: "Góc ở tâm, góc nội tiếp" },
      { id: "c5_t4", name: "Hình quạt tròn và hình vành khuyên" }
    ]
  },
  {
    id: "c6",
    name: "Chương 6: Hàm số y = ax^2 (a ≠ 0) và Phương trình bậc hai một ẩn",
    topics: [
      { id: "c6_t1", name: "Hàm số y = ax^2 (a ≠ 0)" },
      { id: "c6_t2", name: "Phương trình bậc hai một ẩn" },
      { id: "c6_t3", name: "Định lí Viète" }
    ]
  },
  {
    id: "c7",
    name: "Chương 7: Một số yếu tố Thống kê",
    topics: [
      { id: "c7_t1", name: "Bảng tần số và biểu đồ tần số" },
      { id: "c7_t2", name: "Bảng tần số tương đối và biểu đồ tần số tương đối" }
    ]
  },
  {
    id: "c8",
    name: "Chương 8: Một số yếu tố Xác suất",
    topics: [
      { id: "c8_t1", name: "Không gian mẫu và biến cố" },
      { id: "c8_t2", name: "Xác suất của biến cố" }
    ]
  },
  {
    id: "c9",
    name: "Chương 9: Tứ giác nội tiếp. Đa giác đều",
    topics: [
      { id: "c9_t1", name: "Đường tròn ngoại tiếp tam giác. Đường tròn nội tiếp tam giác" },
      { id: "c9_t2", name: "Tứ giác nội tiếp" },
      { id: "c9_t3", name: "Đa giác đều và phép quay" }
    ]
  },
  {
    id: "c10",
    name: "Chương 10: Các hình khối trong thực tiễn",
    topics: [
      { id: "c10_t1", name: "Hình trụ" },
      { id: "c10_t2", name: "Hình nón" },
      { id: "c10_t3", name: "Hình cầu" }
    ]
  }
];