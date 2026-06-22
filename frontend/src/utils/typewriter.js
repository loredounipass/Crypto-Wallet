export function typewriter(text, onUpdate, { speed = 25 } = {}) {
    let index = 0;
    let cancelled = false;

    const promise = new Promise((resolve) => {
        const interval = setInterval(() => {
            if (cancelled) {
                clearInterval(interval);
                resolve();
                return;
            }
            index++;
            onUpdate(text.slice(0, index));
            if (index >= text.length) {
                clearInterval(interval);
                resolve();
            }
        }, speed);
    });

    return {
        promise,
        cancel: () => { cancelled = true; }
    };
}
