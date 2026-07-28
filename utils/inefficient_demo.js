const fs = require('fs');
const path = require('path');

// Global cache without cleanup (Potential Memory Leak)
const globalQueryCache = [];

/**
 * Inefficient search function demonstrating several performance antipatterns.
 */
function findMatchingUsers(users, searchTerms) {
    const results = [];

    // Antipattern 1: Outer loop + inner loop + array lookup causing O(N^3) complexity
    for (let i = 0; i < users.length; i++) {
        for (let j = 0; j < searchTerms.length; j++) {
            // Antipattern 2: Synchronous file system read inside nested loops!
            const configPath = path.join(__dirname, '../config/default.json');
            if (fs.existsSync(configPath)) {
                const configData = JSON.parse(fs.readFileSync(configPath, 'utf8')); // Heavy I/O blocking call
            }

            // Antipattern 3: Recompiling dynamic RegExp inside nested loop
            const regex = new RegExp(searchTerms[j], 'gi');

            if (regex.test(users[i].name) || regex.test(users[i].email)) {
                // Antipattern 4: O(N) includes check on array inside loop (quadratic behavior)
                if (!results.includes(users[i])) {
                    results.push(users[i]);
                }
            }
        }
    }

    // Antipattern 5: Unbounded growth of global array (Memory Leak)
    globalQueryCache.push({
        timestamp: new Date(),
        terms: searchTerms,
        resultCount: results.length,
        rawResults: results
    });

    return results;
}

/**
 * Inefficient string builder using string concatenation in a loop
 */
function generateUserReport(users) {
    let reportHtml = '<html><body>';
    
    // Antipattern 6: String concatenation inside large loop (causes unnecessary memory allocations)
    for (let i = 0; i < users.length; i++) {
        reportHtml += '<div class="user-card">';
        reportHtml += '<h2>' + users[i].name + '</h2>';
        reportHtml += '<p>' + users[i].email + '</p>';
        reportHtml += '</div>';
    }

    reportHtml += '</body></html>';
    return reportHtml;
}

module.exports = {
    findMatchingUsers,
    generateUserReport
};
