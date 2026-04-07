if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const partyBtns = document.querySelectorAll('.party-button');
        const dialog = document.getElementById('confirm-dialog');
        const choiceEl = dialog.querySelector('.choice');
        const closeBtn = dialog.querySelector('.dialog-close');
        const yesBtn = document.getElementById('yes-button');
        const noBtn = document.getElementById('no-button');
        const voterInputContainer = document.getElementById('voter-input');
        const voterIdInput = document.getElementById('voter-id');
        const enterButton = document.getElementById('enter-button');
        const inputWarning = document.getElementById('input-warning');

        function storeVoterId(voterId) {
            try {
                localStorage.setItem('voterId', voterId);
            } catch (err) {
                console.warn('Failed to store voter id', err);
            }
        }

        function getStoredVoterId() {
            try {
                return localStorage.getItem('voterId');
            } catch (err) {
                return null;
            }
        }

        // helper to reset dialog UI back to initial state
        function resetDialogUI() {
            // show body/footer, hide input, clear warnings
            const body = dialog.querySelector('.dialog-body');
            const footer = dialog.querySelector('.dialog-footer');
            if (body) body.hidden = false;
            if (footer) footer.style.visibility = '';
            if (yesBtn) yesBtn.style.visibility = '';
            if (noBtn) noBtn.style.visibility = '';
            if (voterInputContainer) {
                voterInputContainer.hidden = true;
                voterInputContainer.setAttribute('aria-hidden', 'true');
            }
            if (voterIdInput) voterIdInput.value = '';
            if (inputWarning) inputWarning.textContent = '';
        }

        // Close dialog helper
        function closeDialog() {
            if (typeof dialog.close === 'function' && dialog.open) {
                dialog.close();
            } else {
                dialog.classList.add('hide');
                dialog.setAttribute('aria-hidden', 'true');
            }
            // reset UI so next time dialog opens it's in initial state
            resetDialogUI();
        }

        // submit voter id (called from Enter button, Enter key, or backdrop click when input visible)
        function submitVoterId() {
            if (!voterIdInput) return;
            const typed = voterIdInput.value.trim();
            if (!typed) {
                if (inputWarning) inputWarning.textContent = 'Please enter a user id.';
                return false;
            }

            const stored = localStorage.getItem('voterId');
            // store only if not already present
            if (!stored) {
                storeVoterId(typed);
            }

            // attempt vote using typed id
            const option = choiceEl.textContent.trim();
            const res = vote(option, typed);
            if (res && res.includes('already voted')) {
                if (inputWarning) inputWarning.textContent = 'You have already voted.';
                return false;
            }

            // success -> reset and close
            resetDialogUI();
            closeDialog();
            return true;
        }

        // Open the dialog and populate selected party
        partyBtns.forEach(button => {
            button.addEventListener('click', () => {
                const party = button.textContent.trim();
                choiceEl.textContent = party;

                // Ensure dialog shows in its initial state (input hidden)
                resetDialogUI();

                // Prefer native dialog API when available
                if (typeof dialog.showModal === 'function') {
                    try {
                        if (!dialog.open) dialog.showModal();
                    } catch (err) {
                        // fallback to class toggle
                        dialog.classList.remove('hide');
                        dialog.setAttribute('aria-hidden', 'false');
                    }
                } else {
                    // fallback for browsers without <dialog>
                    dialog.classList.remove('hide');
                    dialog.setAttribute('aria-hidden', 'false');
                }
            });
        });

        // Close button (top-right "✕")
        if (closeBtn) closeBtn.addEventListener('click', closeDialog);

        // Yes / No buttons should both close the dialog (voting action can be hooked later)
        if (yesBtn) {
            yesBtn.addEventListener('click', () => {
                // show voter id input prompt instead of immediately voting
                if (voterInputContainer) {
                    // hide message/footer and show input
                    const body = dialog.querySelector('.dialog-body');
                    const footer = dialog.querySelector('.dialog-footer');
                    if (body) body.hidden = true;
                    // keep footer visible so layout doesn't shift; hide buttons visually
                    if (footer) footer.style.visibility = 'visible';
                    if (yesBtn) yesBtn.style.visibility = 'hidden';
                    if (noBtn) noBtn.style.visibility = 'hidden';
                    // prefill with stored voter id if present
                    const stored = getStoredVoterId();
                    if (voterIdInput) voterIdInput.value = stored || '';
                    voterInputContainer.hidden = false;
                    voterInputContainer.setAttribute('aria-hidden', 'false');
                    // clear previous warnings
                    if (inputWarning) inputWarning.textContent = '';
                    if (voterIdInput) voterIdInput.focus();
                }
            });
        }
        if (noBtn) {
            noBtn.addEventListener('click', () => {
                closeDialog();
            });
        }

        if (enterButton) {
            enterButton.addEventListener('click', (e) => {
                e.preventDefault();
                submitVoterId();
            });
        }

        if (voterIdInput) {
            voterIdInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    submitVoterId();
                }
            });
        }

        // Click outside dialog content closes it (backdrop click)
        if (dialog) {
            dialog.addEventListener('click', (e) => {
                const rect = dialog.getBoundingClientRect();
                const isInDialog = (
                    e.clientX >= rect.left &&
                    e.clientX <= rect.right &&
                    e.clientY >= rect.top &&
                    e.clientY <= rect.bottom
                );
                if (!isInDialog) {
                    // if voter input is visible, treat backdrop click as submit
                    if (voterInputContainer && !voterInputContainer.hidden) {
                        submitVoterId();
                    } else {
                        closeDialog();
                    }
                }
            });
            
            // ESC key fallback for closing
            dialog.addEventListener('cancel', (e) => {
                // native cancel event when pressing ESC
                e.preventDefault();
                closeDialog();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // only close if dialog is visible/open
                const isVisible = dialog.classList.contains('hide') ? false : true;
                if (isVisible || (typeof dialog.open !== 'undefined' && dialog.open)) {
                    closeDialog();
                }
            }
        });
    });
}
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
    // Prevent a voter from voting more than once across all options
    for (const [opt, voters] of poll.entries()) {
        if (voters.has(voterId)) {
            return `Voter ${voterId} has already voted for "${opt}".`
        }
    }

    poll.get(option).add(voterId);
    return `Voter ${voterId} voted for "${option}".`
}
addOption("PDP");
addOption("NC");
addOption("JKLF");
addOption("Congress");
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