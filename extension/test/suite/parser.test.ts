import * as assert from 'assert';
import * as path from 'path';
import { BibleManager } from '../../src/bibleManager';

describe('BibleManager Reference & Book Parsing Tests', () => {
  let manager: BibleManager;

  before(() => {
    // Extension path is parent of test
    const extPath = path.resolve(__dirname, '../../');
    manager = new BibleManager(extPath);
  });

  it('should find English book names and abbreviations', () => {
    const gen = manager.findBook('Genesis');
    assert.ok(gen);
    assert.strictEqual(gen?.code, 'GEN');

    const genAbbr = manager.findBook('gen');
    assert.ok(genAbbr);
    assert.strictEqual(genAbbr?.id, 1);

    const psa = manager.findBook('Psalms');
    assert.ok(psa);
    assert.strictEqual(psa?.id, 19);

    const john = manager.findBook('John');
    assert.ok(john);
    assert.strictEqual(john?.id, 43);

    const firstJohn = manager.findBook('1 John');
    assert.ok(firstJohn);
    assert.strictEqual(firstJohn?.id, 62);
  });

  it('should find authentic isiZulu book names with and without prefixes', () => {
    // USenesisi / Genesise
    const zGen = manager.findBook('USenesisi');
    assert.ok(zGen, 'Should find USenesisi');
    assert.strictEqual(zGen?.id, 1);

    const zGenNoPref = manager.findBook('Senesisi');
    assert.ok(zGenNoPref, 'Should find Senesisi without U- prefix');
    assert.strictEqual(zGenNoPref?.id, 1);

    // AmaHubo / Hubo
    const zPsa = manager.findBook('AmaHubo');
    assert.ok(zPsa, 'Should find AmaHubo');
    assert.strictEqual(zPsa?.id, 19);

    const zPsaShort = manager.findBook('Hubo');
    assert.ok(zPsaShort, 'Should find Hubo');
    assert.strictEqual(zPsaShort?.id, 19);

    // UMathewu / Mathewu
    const zMatt = manager.findBook('UMathewu');
    assert.ok(zMatt);
    assert.strictEqual(zMatt?.id, 40);

    const zMattShort = manager.findBook('Mathewu');
    assert.ok(zMattShort);
    assert.strictEqual(zMattShort?.id, 40);

    // IsAmbulo / Zambulo
    const zRev = manager.findBook('IsAmbulo');
    assert.ok(zRev);
    assert.strictEqual(zRev?.id, 66);

    const zRevShort = manager.findBook('Zambulo');
    assert.ok(zRevShort);
    assert.strictEqual(zRevShort?.id, 66);

    // KwabaseRoma / Roma
    const zRom = manager.findBook('KwabaseRoma');
    assert.ok(zRom);
    assert.strictEqual(zRom?.id, 45);

    // IzEnzo
    const zActs = manager.findBook('IzEnzo');
    assert.ok(zActs);
    assert.strictEqual(zActs?.id, 44);
  });

  it('should parse complex references accurately', () => {
    // Joh 3:16
    const ref1 = manager.parseReference('Joh 3:16');
    assert.ok(ref1);
    assert.strictEqual(ref1?.book.id, 43);
    assert.strictEqual(ref1?.chapter, 3);
    assert.strictEqual(ref1?.verse, 16);

    // AmaHubo 23:1
    const ref2 = manager.parseReference('AmaHubo 23:1');
    assert.ok(ref2);
    assert.strictEqual(ref2?.book.id, 19);
    assert.strictEqual(ref2?.chapter, 23);
    assert.strictEqual(ref2?.verse, 1);

    // Hubo 23:1
    const ref3 = manager.parseReference('Hubo 23:1');
    assert.ok(ref3);
    assert.strictEqual(ref3?.book.id, 19);
    assert.strictEqual(ref3?.chapter, 23);
    assert.strictEqual(ref3?.verse, 1);

    // Phil 4:13
    const ref4 = manager.parseReference('Phil 4:13');
    assert.ok(ref4);
    assert.strictEqual(ref4?.book.id, 50);
    assert.strictEqual(ref4?.chapter, 4);
    assert.strictEqual(ref4?.verse, 13);

    // Chapter only: Gen 1
    const ref5 = manager.parseReference('Gen 1');
    assert.ok(ref5);
    assert.strictEqual(ref5?.book.id, 1);
    assert.strictEqual(ref5?.chapter, 1);
    assert.strictEqual(ref5?.verse, undefined);

    // 1 Korinte 13:4
    const ref6 = manager.parseReference('1 Korinte 13:4');
    assert.ok(ref6);
    assert.strictEqual(ref6?.book.id, 46);
    assert.strictEqual(ref6?.chapter, 13);
    assert.strictEqual(ref6?.verse, 4);
  });

  it('should gracefully reject invalid references', () => {
    assert.strictEqual(manager.parseReference('NonexistentBook 1:1'), undefined);
    assert.strictEqual(manager.parseReference(''), undefined);
    // Invalid chapter number beyond book
    assert.strictEqual(manager.parseReference('Gen 999:1'), undefined);
  });
});

