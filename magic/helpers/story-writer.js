let striptags = require('striptags');
let _ = require('lodash');

module.exports = writeStory;

let stories = {
    plaintext: '',
    html: ''
};

function writeStory(object) {

    stories.html = `<p>`;
    
    stories.html += `I am a <mark>${object.worktypes ? object.worktypes[0].worktype : object.classification.toLowerCase()}</mark>.`;
    stories.html += ` I am <mark>${object.agequalifier ? object.agequalifier : ''} ${object.age}</mark> years old.`;

    if (object.titlescount == 1) {
        stories.html += ` I go by <mark>${object.title}</mark>.`;
    } else {
        let titles = object.titles.map(t => t.title);
        stories.html += ` I go by <mark>${object.title}</mark>, and people have also referred to me by <mark>${titles.slice(1).join(", ")}</mark>.`;
    }

    stories.html += ` I came to life in <mark>${object.dated}</mark>${period(object)}${places(object)}.`;
    stories.html += people(object);
    stories.html += ` I belong to the <mark>${object.culture}</mark> culture.`;
    stories.html += ` I’m made${medium(object)}${technique(object)}.`;
    stories.html += dimensions(object);

    stories.html += `</p><p>`;

    stories.html += provenance(object);

    stories.html += ` ${accessionyear(object)} I am now part of the <mark>${object.division}</mark> in my new home.</p>`; 

    stories.html += `<p>`;
    stories.html += publications(object);
    stories.html += exhibitions(object);
    stories.html += `</p>`;

    stories.html += gallery(object);

    stories.html += colors(object);

    stories.html += `<p>If you ever want to call me, my basic ID number is <mark>${object.id}</mark> and my formal number is <mark>${object.objectnumber}</mark>.</p>`;

    stories.plaintext = striptags(stories.html);

    return stories;
}    

function colors(object) {
    if (object.colors) {
        let colorList = object.colors.map(c => `${c.percentRounded}% ${c.color} (${c.hue})`).join (", ");
        return `<p>My colors are primarily ${colorList}.</p>`;
    } else {
        return '';
    }
}

function gallery(object) {
    if (object.gallery) {
        return `<p>If you are interested in meeting with me, I’m available on Level <mark>${object.gallery.floor}</mark>, Room <mark>${object.gallery.galleryid}</mark>, <mark>${object.gallery.name}</mark>${object.gallery.theme ? ' <mark>' + object.gallery.theme + '</mark>' : ''}. I am in a room with <mark>${object.gallery.details.objectcount}</mark> other objects. I've been here for <mark>${object.gallery.age}</mark> days.</p>`;
    } else {
        return ``;
    }
}

function publications(object) {
    if (object.publicationcount == 0) {
        return ` As far as I know, I haven't been published.`;
    } else {
        let sample = _.sampleSize(object.publications, 3);
        sample = sample.map(s => `the ${s.publicationyear} ${s.format.toLowerCase()} "<em>${s.title}</em>"`).join(", ");

        if (object.publicationcount == 1) {
            return ` I have been discussed in <mark>${object.publications[0].title}</mark> ${object.publications[0].publicationyear ? 'in <mark>' + object.publications[0].publicationyear + '</mark>' : ''}.`;
        } else if (object.publicationcount > 1 && object.publicationcount < 3) {
            return ` I’m popular, as more than <mark>${object.publicationcount}</mark> people have talked about me in their publications. Some publication titles include ${sample}.`;
        } else {
            return ` I’m quite popular and above average when it comes to being written about. More than <mark>${object.publicationcount}</mark> people have talked about me in their publications. Some publication titles include ${sample}.`;
        }
    }
}

function exhibitions(object) {
    if (object.exhibitioncount == 0) {
        return ` As far as I can remember, I have yet to be exhibited in public.`;
    } else {
        let sample = _.sampleSize(object.exhibitions, 3);
        sample = sample.map(s => `"<em>${s.title}</em>"`).join(", ");

        if (object.exhibitioncount == 1) {
            return ` You may have seen me before. I've been in <mark>${object.exhibitioncount}</mark> exhibition named ${sample}.`;
        } else if (object.exhibitioncount > 1) {
            return ` You may have seen me before. I've been in <mark>${object.exhibitioncount}</mark> exhibitions, including ${sample}.`;
        } else {
            return ``;
        }
    }
}

function accessionyear(object) {
    if (object.accessionyear) {
        return `I came into the collection of the Harvard Art Museums in <mark>${object.accessionyear}</mark> (<mark>${object.agequalifier ? object.agequalifier : ''} ${object.ageatacquisition}</mark> years into my life) by way of ${object.accessionmethod.toLowerCase()}, and`;
    } else {
        return ``;
    }
}

function provenance(object) {
    if (object.provenance) {
        if (object.provenancecount < 3) {
            return `I used to belong to <mark>${object.provenance.text}</mark>.`;
        } else {
            return `I used to belong to <mark>${object.provenancecount}</mark> past owners.`;
        }
    } else {
        return ``;
    }
}

function dimensions(object) {
    if (object.dimNoFrame) {
        return ` I measure <mark>${object.dimNoFrame}</mark>.`;
    } else {
        return ` I measure <mark>${object.dimensions}</mark>.`;
    }
}

function medium(object) {
    return object.medium ? ` of <mark>${object.medium}</mark>` : ``;
}

function technique(object) {
    return object.technique ? ` in the technique of <mark>${object.technique.toLowerCase()}</mark>` : ``;
}

function period(object) {
    return object.period ? ` in the <mark>${object.period}</mark>` : ``;
}

function places(object) {
    return object.places ? ` in <mark>${object.places[0].displayname}</mark>` : ``;
}

function people(object) {
    if (object.people) {
        let people = object.people.map(p => `${p.role.toLowerCase()} ${p.name}`).join(', ');
        return ` The <mark>${people}</mark> played a pivotal role in my creation.`;
    } else {
        return '';
    }
}