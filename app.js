const poll = new Map();
const addOption = option => {
    if (option === '') {
        return `Option cannot be empty.`
    }
    if (!poll.has(option)) {
        poll.set(option, new Set());
        return `Option "${option}" added to the poll.`
    }
    return `Option "${option}" already exists.`
}

const vote = (option, voterId) => {
    if (!poll.has(option)) {
        return `Option "${option}" does not exist.`
    }
    if (poll.get(option).has(voterId)) {
        return `Voter ${voterId} has already voted for "${option}".`
    }
    poll.get(option).add(voterId);
    return `Voter ${voterId} voted for "${option}".`
}

addOption('NC')
addOption('PDP')
addOption('AAP')
console.log(vote('AAP', 243));
console.log(vote('AAP', 243));
vote('PDP', 111);
vote('PDP', 121);
vote('PDP', 114);
vote('NC', 231);
vote('NC', 217);
vote('AAP', 251);

const displayResults = () => {
    let result = 'Poll Results:\n';
    const lines = [];
    poll.forEach((id, option) => {
        lines.push(`${option}: ${id.size} votes`);
    })
    result += lines.join('\n')
    return result
}

console.log(displayResults());