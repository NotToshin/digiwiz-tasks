export function validateTransition(previous: string | undefined, next: string, requiresReview: boolean, reviewer: boolean, feedback: string) {
 if(previous==='Done') throw Object.assign(new Error('Done tasks are final'),{status:409});
 if(!previous && ['Done','In Review'].includes(next)) throw Object.assign(new Error('Create an open task first'),{status:409});
 if(previous==='In Review' && next!==previous && (!reviewer || !['Done','In Progress'].includes(next))) throw Object.assign(new Error('Only the project reviewer can approve or return work'),{status:403});
 if(previous==='In Review' && next==='In Progress' && !feedback.trim()) throw Object.assign(new Error('Enter the reason for returning work'),{status:400});
 if(next==='Done' && requiresReview && previous!=='In Review') throw Object.assign(new Error('Submit for review first'),{status:409});
}
