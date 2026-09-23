export function calculateAge(dobString: string): number {
  if (!dobString) return 0;
  // Support YYYY-MM-DD or DD/MM/YYYY
  let birthDate: Date;
  if (dobString.includes('/')) {
    const parts = dobString.split('/');
    if (parts.length === 3) {
      birthDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    } else {
      birthDate = new Date(dobString);
    }
  } else {
    birthDate = new Date(dobString);
  }

  if (isNaN(birthDate.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(0, age);
}
