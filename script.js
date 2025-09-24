// Updated Platinum and Obsidian division logic for answers <1 and ≥1

function calculateDivision(input) {
    if (input < 1) {
        // Logic for inputs less than 1
        return 'Platinum Logic';
    } else {
        // Logic for inputs greater than or equal to 1
        return 'Obsidian Logic';
    }
}