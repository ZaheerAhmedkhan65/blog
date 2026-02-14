const formatRelativeTime = (dateString) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const seconds = Math.floor((now - postDate) / 1000);
    
    if (seconds < 60) {
        return `${seconds}s ago`;
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes}min ago`;
    }
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours}h ago`;
    }
    
    // For dates older than 24 hours, show the day and month
    return postDate.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short'
    });
}


const formateDate = (dateString) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const seconds = Math.floor((now - postDate) / 1000);
    
    if (seconds < 60) {
        return `${seconds}s ago`;
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes}min ago`;
    }
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours}h ago`;
    }
    return postDate.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}


const formatNumberCompact = (count) => {
    if (count < 1000) {
        return count.toString(); // Display as-is: 0-999
    } else if (count < 10000) {
        // Format 1,000-9,999 as 1.0k-9.9k (one decimal place)
        return (count / 1000).toFixed(1) + 'k';
    } else if (count < 100000) {
        // Format 10,000-99,999 as 10k-99k (no decimal)
        return Math.round(count / 1000) + 'k';
    } else if (count < 1000000) {
        // Format 100,000-999,999 as 100k-999k (no decimal)
        return Math.floor(count / 1000) + 'k';
    } else if (count < 1000000000) {
        // Format 1,000,000-999,999,999 as 1M-999M
        return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    } else {
        // Format 1,000,000,000+ as 1B+
        return (count / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    }
}
module.exports = { formatRelativeTime, formateDate, formatNumberCompact };