function Assignment(id, title, dateAssigned, dateDue, ptsEarned, ptsPossible, weight, note, extraCredit) {
    this.id = id;
    this.title = title;
    this.dateAssigned = dateAssigned;
    this.dateDue = dateDue;
    this.ptsEarned = ptsEarned;
    this.ptsPossible = ptsPossible;
    this.weight = weight;
    this.note = note || '';
    this.extraCredit = extraCredit;
}