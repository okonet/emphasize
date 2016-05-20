/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module emphasize
 * @fileoverview Syntax highlighting in ANSI.
 */

'use strict';

/* eslint-env commonjs */

/*
 * Dependencies.
 */

var chalk = require('chalk');
var lowlight = require('lowlight/lib/core.js');

/*
 * Methods.
 */

var high = lowlight.highlight;
var auto = lowlight.highlightAuto;

/*
 * Library - Populated later.
 */

var emphasize;

/*
 * Default style sheet.
 */

var SHEET = {
    'comment': chalk.gray,
    'quote': chalk.gray,

    'keyword': chalk.green,
    'selector-tag': chalk.green,
    'addition': chalk.green,

    'number': chalk.cyan,
    'string': chalk.cyan,
    'meta meta-string': chalk.cyan,
    'literal': chalk.cyan,
    'doctag': chalk.cyan,
    'regexp': chalk.cyan,

    'title': chalk.blue,
    'section': chalk.blue,
    'name': chalk.blue,
    'selector-id': chalk.blue,
    'selector-class': chalk.blue,

    'attribute': chalk.yellow,
    'attr': chalk.yellow,
    'variable': chalk.yellow,
    'template-variable': chalk.yellow,
    'class title': chalk.yellow,
    'type': chalk.yellow,

    'symbol': chalk.magenta,
    'bullet': chalk.magenta,
    'subst': chalk.magenta,
    'meta': chalk.magenta,
    'meta keyword': chalk.magenta,
    'selector-attr': chalk.magenta,
    'selector-pseudo': chalk.magenta,
    'link': chalk.magenta,

    'built_in': chalk.red,
    'deletion': chalk.red,

    'emphasis': chalk.italic,
    'strong': chalk.bold,
    'formula': chalk.inverse
};

/**
 * Visit one `node`.
 *
 * @param {Object} sheet - Style sheet.
 * @param {Node} node - Hast node from lowlight.
 * @return {string} - ANSI highlighted node.
 */
function visit(sheet, node) {
    var name = (node.properties || {}).className;
    var scoped = {};
    var key;
    var parts;
    var color;
    var style;
    var content;

    /* Always just one class. */
    name = name ? name[0].replace(/hljs-/, '') : '';

    for (key in sheet) {
        parts = key.split(' ');
        color = sheet[key];

        if (parts[0] === name) {
            if (parts.length === 1) {
                style = color;
            } else {
                scoped[parts.slice(1).join(' ')] = color;
            }
        } else {
            scoped[key] = color;
        }
    }

    content = '';

    if ('value' in node) {
        content = node.value;
    }

    if ('children' in node) {
        content = all(scoped, node.children);
    }

    if (style) {
        content = style(content);
    }

    return content;
}

/**
 * Visit children in `node`.
 *
 * @param {Object} sheet - Style sheet.
 * @param {Array.<Node>} nodes - Hast nodes from lowlight.
 * @return {string} - ANSI highlighted children.
 */
function all(sheet, nodes) {
    var result = [];
    var length = nodes.length;
    var index = -1;

    while (++index < length) {
        result.push(visit(sheet, nodes[index]));
    }

    return result.join('');
}

/**
 * Highlight `value` as `language`.
 *
 * @param {string} language - Syntax to use.
 * @param {string} value - Value to highlight.
 * @param {Object} [sheet] - Style sheet.
 * @return {Object} - Results.
 */
function highlight(language, value, sheet) {
    var result = high.call(this, language, value);

    result.value = all(sheet || SHEET, result.value);

    return result;
}

/**
 * Highlight `value` and guess its syntax.
 *
 * @param {string} value - Value to highlight.
 * @param {Object} [options] - Configuration or sheet.
 * @return {Object} - Results.
 */
function highlightAuto(value, options) {
    var result;
    var sheet;
    var config;

    if (options) {
        if (options.subset) {
            sheet = options.sheet;

            config = {
                'subset': options.subset
            }
        } else {
            sheet = options;
        }
    }

    if (!sheet) {
        sheet = SHEET;
    }

    result = auto.call(this, value, config);

    result.value = all(sheet, result.value);

    if (result.secondBest) {
        result.secondBest.value = all(sheet, result.secondBest.value);
    }

    return result;
}

/*
 * Inherit.
 */

/** High constructor. */
function Lowlight() {}

Lowlight.prototype = lowlight;

emphasize = new Lowlight();

/*
 * Extend.
 */

emphasize.highlight = highlight;
emphasize.highlightAuto = highlightAuto;

/*
 * Expose.
 */

module.exports = emphasize;