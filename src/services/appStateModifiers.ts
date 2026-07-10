import { Project, Chapter, Snippet, Speaker } from '../types';
import { generateId } from './idService';

//#region Chapter State Modifiers
export function addChapter(prev: Project): Project {
  const narrators = prev.speakers.filter(s => s.isNarrator).sort((a, b) => a.order - b.order);
  let nextSpeakerId: string | null = null;

  if (prev.chapters.length > 0) {
    const prevChapter = prev.chapters[prev.chapters.length - 1];
    if (narrators.length > 1) {
      const prevNarratorIndex = narrators.findIndex(n => n.id === prevChapter.defaultSpeakerId);
      if (prevNarratorIndex !== -1) {
        nextSpeakerId = narrators[(prevNarratorIndex + 1) % narrators.length].id;
      } else {
        nextSpeakerId = prevChapter.defaultSpeakerId;
      }
    } else if (narrators.length === 1) {
      nextSpeakerId = narrators[0].id;
    } else {
      nextSpeakerId = prevChapter.defaultSpeakerId;
    }
  } else {
    if (narrators.length > 0) nextSpeakerId = narrators[0].id;
    else if (prev.speakers.length > 0) nextSpeakerId = prev.speakers[0].id;
  }

  const newChapter: Chapter = {
    id: generateId(),
    order: prev.chapters.length,
    title: `Chapter ${prev.chapters.length + 1}`,
    defaultSpeakerId: nextSpeakerId,
    isCollapsed: false,
    snippets: [{ id: generateId(), order: 0, text: '', speakerId: null, status: 'idle', isCollapsed: false, generations: [], activeGenerationId: null }]
  };
  return { ...prev, chapters: [...prev.chapters, newChapter] };
}

export function moveChapter(prev: Project, index: number, direction: 'up' | 'down'): Project {
  if ((direction === 'up' && index === 0) || (direction === 'down' && index === prev.chapters.length - 1)) return prev;
  const newChapters = [...prev.chapters];
  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  [newChapters[index], newChapters[swapIndex]] = [newChapters[swapIndex], newChapters[index]];
  newChapters.forEach((c, i) => c.order = i);
  return { ...prev, chapters: newChapters };
}

export function updateChapter(prev: Project, chapterId: string, updates: Partial<Chapter>): Project {
  return {
    ...prev,
    chapters: prev.chapters.map(c => c.id === chapterId ? { ...c, ...updates } : c)
  };
}

export function deleteChapter(prev: Project, chapterId: string): Project {
  return {
    ...prev,
    chapters: prev.chapters.filter(c => c.id !== chapterId)
  };
}

export function toggleAllSnippetsInChapter(prev: Project, chapterId: string, collapse: boolean): Project {
  return {
    ...prev,
    chapters: prev.chapters.map(c => {
      if (c.id !== chapterId) return c;
      return {
        ...c,
        snippets: c.snippets.map(s => ({ ...s, isCollapsed: collapse }))
      };
    })
  };
}
//#endregion

//#region Snippet State Modifiers
export function addSnippet(prev: Project, chapterId: string, index: number): Project {
  return {
    ...prev,
    chapters: prev.chapters.map(c => {
      if (c.id !== chapterId) return c;
      const newSnippet: Snippet = { id: generateId(), order: index + 1, text: '', speakerId: null, status: 'idle', isCollapsed: false, generations: [], activeGenerationId: null };
      const newSnippets = [...c.snippets];
      newSnippets.splice(index + 1, 0, newSnippet);
      newSnippets.forEach((s, i) => s.order = i);
      return { ...c, snippets: newSnippets };
    })
  };
}

export function moveSnippet(prev: Project, chapterId: string, index: number, direction: 'up' | 'down'): Project {
  return {
    ...prev,
    chapters: prev.chapters.map(c => {
      if (c.id !== chapterId) return c;
      if ((direction === 'up' && index === 0) || (direction === 'down' && index === c.snippets.length - 1)) return c;
      const newSnippets = [...c.snippets];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      [newSnippets[index], newSnippets[swapIndex]] = [newSnippets[swapIndex], newSnippets[index]];
      newSnippets.forEach((s, i) => s.order = i);
      return { ...c, snippets: newSnippets };
    })
  };
}

export function updateSnippet(prev: Project, chapterId: string, snippetId: string, updates: Partial<Snippet>): Project {
  return {
    ...prev,
    chapters: prev.chapters.map(c => {
      if (c.id !== chapterId) return c;
      return {
        ...c,
        snippets: c.snippets.map(s => s.id === snippetId ? { ...s, ...updates } : s)
      };
    })
  };
}

export function deleteSnippet(prev: Project, chapterId: string, snippetId: string): Project {
  return {
    ...prev,
    chapters: prev.chapters.map(c => {
      if (c.id !== chapterId) return c;
      const newSnippets = c.snippets.filter(s => s.id !== snippetId);
      newSnippets.forEach((s, i) => s.order = i);
      return { ...c, snippets: newSnippets };
    })
  };
}

export function splitSnippet(prev: Project, chapterId: string, snippetId: string, cursorPosition: number): Project {
  return {
    ...prev,
    chapters: prev.chapters.map(c => {
      if (c.id !== chapterId) return c;
      const snippetIndex = c.snippets.findIndex(s => s.id === snippetId);
      if (snippetIndex === -1) return c;
      
      const snippet = c.snippets[snippetIndex];
      const text1 = snippet.text.substring(0, cursorPosition);
      const text2 = snippet.text.substring(cursorPosition);

      const newSnippets = [...c.snippets];
      newSnippets[snippetIndex] = { ...snippet, text: text1, status: 'idle', errorMessage: undefined };
      newSnippets.splice(snippetIndex + 1, 0, {
        id: generateId(),
        order: snippetIndex + 1,
        text: text2,
        speakerId: snippet.speakerId,
        status: 'idle',
        isCollapsed: false,
        generations: [],
        activeGenerationId: null
      });
      newSnippets.forEach((s, i) => s.order = i);

      return { ...c, snippets: newSnippets };
    })
  };
}

export function joinSnippetWithNext(prev: Project, chapterId: string, snippetId: string): Project {
  return {
    ...prev,
    chapters: prev.chapters.map(c => {
      if (c.id !== chapterId) return c;
      const snippetIndex = c.snippets.findIndex(s => s.id === snippetId);
      if (snippetIndex === -1 || snippetIndex === c.snippets.length - 1) return c;

      const currentSnippet = c.snippets[snippetIndex];
      const nextSnippet = c.snippets[snippetIndex + 1];

      const newSnippets = [...c.snippets];
      newSnippets[snippetIndex] = { 
        ...currentSnippet, 
        text: currentSnippet.text + (currentSnippet.text.endsWith(' ') ? '' : ' ') + nextSnippet.text,
        status: 'idle',
        errorMessage: undefined
      };
      newSnippets.splice(snippetIndex + 1, 1);
      newSnippets.forEach((s, i) => s.order = i);

      return { ...c, snippets: newSnippets };
    })
  };
}
//#endregion

//#region Speaker State Modifiers
export function addSpeaker(prev: Project, voices: { id: string }[]): Project {
  const newSpeaker: Speaker = {
    id: generateId(),
    order: prev.speakers.length,
    name: `Speaker ${prev.speakers.length + 1}`,
    voice: voices[0]?.id || 'Zephyr',
    style: '',
    isNarrator: false
  };
  return { ...prev, speakers: [...prev.speakers, newSpeaker] };
}

export function updateSpeaker(prev: Project, speakerId: string, updates: Partial<Speaker>): Project {
  return {
    ...prev,
    speakers: prev.speakers.map(s => s.id === speakerId ? { ...s, ...updates } : s)
  };
}

export function deleteSpeaker(prev: Project, speakerId: string): Project {
  return {
    ...prev,
    speakers: prev.speakers.filter(s => s.id !== speakerId).map((s, i) => ({ ...s, order: i })),
    chapters: prev.chapters.map(c => ({
      ...c,
      defaultSpeakerId: c.defaultSpeakerId === speakerId ? null : c.defaultSpeakerId,
      snippets: c.snippets.map(s => ({
        ...s,
        speakerId: s.speakerId === speakerId ? null : s.speakerId
      }))
    }))
  };
}

export function moveSpeaker(prev: Project, index: number, direction: 'up' | 'down'): Project {
  if ((direction === 'up' && index === 0) || (direction === 'down' && index === prev.speakers.length - 1)) return prev;
  const newSpeakers = [...prev.speakers];
  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  [newSpeakers[index], newSpeakers[swapIndex]] = [newSpeakers[swapIndex], newSpeakers[index]];
  newSpeakers.forEach((s, i) => s.order = i);
  return { ...prev, speakers: newSpeakers };
}
//#endregion
