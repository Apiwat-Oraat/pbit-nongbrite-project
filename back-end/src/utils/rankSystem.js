export const MAX_POSSIBLE_SCORE = 6300;

const RANKS = [
    { id: 1, name: "Beginner", label: "มือใหม่", minScore: 0, icon: "🐣"},
    { id: 2, name: "Explorer", label: "นักสำรวจ", minScore: 500, icon: "🧭"},
    { id: 3, name: "Thinker", label: "นักคิด", minScore: 1500, icon: "💡"},
    { id: 4, name: "Solver", label: "นักแก้ปัญหา", minScore: 2500, icon: "🧩"},
    { id: 5, name: "Strategist", label: "นักวางแผน", minScore: 3500, icon: "♟️"},
    { id: 6, name: "Master", label: "ปรมาจารย์", minScore: 4500, icon: "🎖️"},
    { id: 7, name: "Legend", label: "ตำนาน", minScore: 5500, icon: "👑"}
];


export const calculateRank = (totalScore) => {
  const score = Math.min(totalScore, MAX_POSSIBLE_SCORE);
  const rank = RANKS.slice().reverse().find(r => score >= r.minScore);
  return rank || RANKS[0];
};

// ฟังก์ชันหา Level (100 คะแนน = 1 Level)
export const calculateLevel = (totalScore) => {
    return Math.floor(totalScore / 100) + 1;
};

// คำนวณ % ความสำเร็จรวม (เผื่อใช้โชว์หลอด Progress)
export const calculateTotalProgress = (totalScore) => {
    const progress = (totalScore / MAX_POSSIBLE_SCORE) * 100;
    return Math.min(progress, 100).toFixed(1);
};

export default { calculateRank, calculateLevel, calculateTotalProgress, RANKS };

