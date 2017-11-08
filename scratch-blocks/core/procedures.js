/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2012 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Utility functions for handling procedures.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

/**
 * @name Blockly.Procedures
 * @namespace
 **/
goog.provide('Blockly.Procedures');

goog.require('Blockly.Blocks');
goog.require('Blockly.constants');
goog.require('Blockly.Field');
goog.require('Blockly.Names');
goog.require('Blockly.Workspace');


/**
 * Constant to separate procedure names from variables and generated functions
 * when running generators.
 * @deprecated Use Blockly.PROCEDURE_CATEGORY_NAME
 */
Blockly.Procedures.NAME_TYPE = Blockly.PROCEDURE_CATEGORY_NAME;

/**
 * Find all user-created procedure definitions in a workspace.
 * @param {!Blockly.Workspace} root Root workspace.
 * @return {!Array.<!Array.<!Array>>} Pair of arrays, the
 *     first contains procedures without return variables, the second with.
 *     Each procedure is defined by a three-element list of name, parameter
 *     list, and return value boolean.
 */
Blockly.Procedures.allProcedures = function(root) {
  var blocks = root.getAllBlocks();
  var proceduresReturn = [];
  var proceduresNoReturn = [];
  for (var i = 0; i < blocks.length; i++) {
    if (blocks[i].getProcedureDef) {
      var tuple = blocks[i].getProcedureDef();
      if (tuple) {
        if (tuple[2]) {
          proceduresReturn.push(tuple);
        } else {
          proceduresNoReturn.push(tuple);
        }
      }
    }
  }
  proceduresNoReturn.sort(Blockly.Procedures.procTupleComparator_);
  proceduresReturn.sort(Blockly.Procedures.procTupleComparator_);
  return [proceduresNoReturn, proceduresReturn];
};

/**
 * Comparison function for case-insensitive sorting of the first element of
 * a tuple.
 * @param {!Array} ta First tuple.
 * @param {!Array} tb Second tuple.
 * @return {number} -1, 0, or 1 to signify greater than, equality, or less than.
 * @private
 */
Blockly.Procedures.procTupleComparator_ = function(ta, tb) {
  return ta[0].toLowerCase().localeCompare(tb[0].toLowerCase());
};

/**
 * Ensure two identically-named procedures don't exist.
 * @param {string} name Proposed procedure name.
 * @param {!Blockly.Block} block Block to disambiguate.
 * @return {string} Non-colliding name.
 */
Blockly.Procedures.findLegalName = function(name, block) {
  if (block.isInFlyout) {
    // Flyouts can have multiple procedures called 'do something'.
    return name;
  }
  while (!Blockly.Procedures.isLegalName_(name, block.workspace, block)) {
    // Collision with another procedure.
    var r = name.match(/^(.*?)(\d+)$/);
    if (!r) {
      name += '2';
    } else {
      name = r[1] + (parseInt(r[2], 10) + 1);
    }
  }
  return name;
};

/**
 * Does this procedure have a legal name?  Illegal names include names of
 * procedures already defined.
 * @param {string} name The questionable name.
 * @param {!Blockly.Workspace} workspace The workspace to scan for collisions.
 * @param {Blockly.Block=} opt_exclude Optional block to exclude from
 *     comparisons (one doesn't want to collide with oneself).
 * @return {boolean} True if the name is legal.
 * @private
 */
Blockly.Procedures.isLegalName_ = function(name, workspace, opt_exclude) {
  return !Blockly.Procedures.isNameUsed(name, workspace, opt_exclude);
};

/**
 * Return if the given name is already a procedure name.
 * @param {string} name The questionable name.
 * @param {!Blockly.Workspace} workspace The workspace to scan for collisions.
 * @param {Blockly.Block=} opt_exclude Optional block to exclude from
 *     comparisons (one doesn't want to collide with oneself).
 * @return {boolean} True if the name is used, otherwise return false.
 */
Blockly.Procedures.isNameUsed = function(name, workspace, opt_exclude) {
  var blocks = workspace.getAllBlocks();
  // Iterate through every block and check the name.
  for (var i = 0; i < blocks.length; i++) {
    if (blocks[i] == opt_exclude) {
      continue;
    }
    if (blocks[i].getProcedureDef) {
      var procName = blocks[i].getProcedureDef();
      if (Blockly.Names.equals(procName[0], name)) {
        return false;
      }
    }
  }
  return true;
};

/**
 * Rename a procedure.  Called by the editable field.
 * @param {string} name The proposed new name.
 * @return {string} The accepted name.
 * @this {Blockly.Field}
 */
Blockly.Procedures.rename = function(name) {
  // Strip leading and trailing whitespace.  Beyond this, all names are legal.
  name = name.replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');

  // Ensure two identically-named procedures don't exist.
  var legalName = Blockly.Procedures.findLegalName(name, this.sourceBlock_);
  var oldName = this.text_;
  if (oldName != name && oldName != legalName) {
    // Rename any callers.
    var blocks = this.sourceBlock_.workspace.getAllBlocks();
    for (var i = 0; i < blocks.length; i++) {
      if (blocks[i].renameProcedure) {
        blocks[i].renameProcedure(oldName, legalName);
      }
    }
  }
  return legalName;
};

/**
 * Construct the blocks required by the flyout for the procedure category.
 * @param {!Blockly.Workspace} workspace The workspace contianing procedures.
 * @return {!Array.<!Element>} Array of XML block elements.
 */
Blockly.Procedures.flyoutCategory = function(workspace) {
  var xmlList = [];
  if (Blockly.Blocks['procedures_defnoreturn']) {
    // <block type="procedures_defnoreturn" gap="16">
    //     <field name="NAME">do something</field>
    // </block>
    var block = goog.dom.createDom('block');
    block.setAttribute('type', 'procedures_defnoreturn');
    block.setAttribute('gap', 16);
    var nameField = goog.dom.createDom('field', null,
        Blockly.Msg.PROCEDURES_DEFNORETURN_PROCEDURE);
    nameField.setAttribute('name', 'NAME');
    block.appendChild(nameField);
    xmlList.push(block);
  }
  if (Blockly.Blocks['procedures_defreturn']) {
    // <block type="procedures_defreturn" gap="16">
    //     <field name="NAME">do something</field>
    // </block>
    var block = goog.dom.createDom('block');
    block.setAttribute('type', 'procedures_defreturn');
    block.setAttribute('gap', 16);
    var nameField = goog.dom.createDom('field', null,
        Blockly.Msg.PROCEDURES_DEFRETURN_PROCEDURE);
    nameField.setAttribute('name', 'NAME');
    block.appendChild(nameField);
    xmlList.push(block);
  }
  if (Blockly.Blocks['procedures_report']) {
    // <block type="procedures_ifreturn" gap="16"></block>
    var block = goog.dom.createDom('block');
    block.setAttribute('type', 'procedures_report');
    block.setAttribute('gap', 16);
    xmlList.push(block);
  }
  if (xmlList.length) {
    // Add slightly larger gap between system blocks and user calls.
    xmlList[xmlList.length - 1].setAttribute('gap', 24);
  }

  function populateProcedures(procedureList, templateName) {
    for (var i = 0; i < procedureList.length; i++) {
      var name = procedureList[i][0];
      var args = procedureList[i][1];
      // <block type="procedures_callnoreturn" gap="16">
      //   <mutation name="do something">
      //     <arg name="x"></arg>
      //   </mutation>
      // </block>
      var block = goog.dom.createDom('block');
      block.setAttribute('type', templateName);
      block.setAttribute('gap', 16);
      var mutation = goog.dom.createDom('mutation');
      mutation.setAttribute('name', name);
      block.appendChild(mutation);
      for (var j = 0; j < args.length; j++) {
        var arg = goog.dom.createDom('arg');
        arg.setAttribute('name', args[j]);
        mutation.appendChild(arg);
      }
      xmlList.push(block);
    }
  }

  var tuple = Blockly.Procedures.allProcedures(workspace);
  populateProcedures(tuple[0], 'procedures_callnoreturn');
  populateProcedures(tuple[1], 'procedures_callreturn');
  return xmlList;
};

/**
 * Find all callers of a named procedure.
 * @param {string} name Name of procedure (procCode in scratch-blocks).
 * @param {!Blockly.Workspace} ws The workspace to find callers in.
 * @param {!Blockly.Block} definitionRoot The root of the stack where the
 *     procedure is defined.
 * @param {boolean} allowRecursive True if the search should include recursive
 *     procedure calls.  False if the search should ignore the stack starting
 *     with definitionRoot.
 * @return {!Array.<!Blockly.Block>} Array of caller blocks.
 * @package
 */
Blockly.Procedures.getCallers = function(name, ws, definitionRoot,
    allowRecursive) {
  var allBlocks = [];
  var topBlocks = ws.getTopBlocks();

  // Start by deciding which stacks to investigate.
  for (var i = 0; i < topBlocks.length; i++) {
    var block = topBlocks[i];
    if (block.id == definitionRoot.id && !allowRecursive) {
      continue;
    }
    allBlocks.push.apply(allBlocks, block.getDescendants());
  }

  var callers = [];
  for (var i = 0; i < allBlocks.length; i++) {
    var block = allBlocks[i];
    if (block.type == 'procedures_callnoreturn') {
      var procCode = block.getProcCode();
      if (procCode && procCode == name) {
        callers.push(block);
      }
    }
  }
  return callers;
};

/**
 * When a procedure definition changes its parameters, find and edit all its
 * callers.
 * @param {!Blockly.Block} defBlock Procedure definition block.
 */
Blockly.Procedures.mutateCallers = function(defBlock) {
  // TODO(#1143) Update this for scratch procedures.
  var oldRecordUndo = Blockly.Events.recordUndo;
  var name = defBlock.getProcedureDef()[0];
  var xmlElement = defBlock.mutationToDom(true);
  var callers = Blockly.Procedures.getCallers(name, defBlock.workspace);
  for (var i = 0, caller; caller = callers[i]; i++) {
    var oldMutationDom = caller.mutationToDom();
    var oldMutation = oldMutationDom && Blockly.Xml.domToText(oldMutationDom);
    caller.domToMutation(xmlElement);
    var newMutationDom = caller.mutationToDom();
    var newMutation = newMutationDom && Blockly.Xml.domToText(newMutationDom);
    if (oldMutation != newMutation) {
      // Fire a mutation on every caller block.  But don't record this as an
      // undo action since it is deterministically tied to the procedure's
      // definition mutation.
      Blockly.Events.recordUndo = false;
      Blockly.Events.fire(new Blockly.Events.BlockChange(
          caller, 'mutation', null, oldMutation, newMutation));
      Blockly.Events.recordUndo = oldRecordUndo;
    }
  }
};

/**
 * Find the definition block for the named procedure.
 * @param {string} name Name of procedure.
 * @param {!Blockly.Workspace} workspace The workspace to search.
 * @return {Blockly.Block} The procedure definition block, or null not found.
 */
Blockly.Procedures.getDefinition = function(name, workspace) {
  // Assume that a procedure definition is a top block.
  var blocks = workspace.getTopBlocks(false);
  for (var i = 0; i < blocks.length; i++) {
    if (blocks[i].getProcedureDef) {
      var tuple = blocks[i].getProcedureDef();
      if (tuple && Blockly.Names.equals(tuple[0], name)) {
        return blocks[i];
      }
    }
  }
  return null;
};

/**
 * Callback to open the modal for editing custom procedures.
 * TODO(#603): Implement.
 * @param {!Blockly.Block} block The block that was right-clicked.
 * @private
 */
Blockly.Procedures.editProcedureCallback_ = function(block) {
  if (block.type == 'procedures_defnoreturn') {
    var input = block.getInput('custom_block');
    if (!input) {
      alert('Bad input'); // TODO: Decide what to do about this.
      return;
    }
    var conn = input.connection;
    if (!conn) {
      alert('Bad connection'); // TODO: Decide what to do about this.
      return;
    }
    var innerBlock = conn.targetBlock();
    if (!innerBlock || !innerBlock.type == 'procedures_callnoreturn_internal') {
      alert('Bad inner block'); // TODO: Decide what to do about this.
      return;
    }
    block = innerBlock;
  }
  alert('TODO(#603): implement function editing (procCode was "' +
      block.procCode_ + '")');
};

/**
 * Make a context menu option for editing a custom procedure.
 * This appears in the context menu for procedure definitions and procedure
 * calls.
 * @param {!Blockly.BlockSvg} block The block where the right-click originated.
 * @return {!Object} A menu option, containing text, enabled, and a callback.
 * @package
 */
Blockly.Procedures.makeEditOption = function(block) {
  var editOption = {
    enabled: true,
    text: Blockly.Msg.EDIT_PROCEDURE,
    callback: function() {
      Blockly.Procedures.editProcedureCallback_(block);
    }
  };
  return editOption;
};

/**
 * Callback to show the procedure definition corresponding to a custom command
 * block.
 * TODO(#1136): Implement.
 * @param {!Blockly.Block} block The block that was right-clicked.
 * @private
 */
Blockly.Procedures.showProcedureDefCallback_ = function(block) {
  alert('TODO(#1136): implement showing procedure definition (procCode was "' +
      block.procCode_ + '")');
};

/**
 * Make a context menu option for showing the definition for a custom procedure,
 * based on a right-click on a custom command block.
 * @param {!Blockly.BlockSvg} block The block where the right-click originated.
 * @return {!Object} A menu option, containing text, enabled, and a callback.
 * @package
 */
Blockly.Procedures.makeShowDefinitionOption = function(block) {
  var option = {
    enabled: true,
    text: Blockly.Msg.SHOW_PROCEDURE_DEFINITION,
    callback: function() {
      Blockly.Procedures.showProcedureDefCallback_(block);
    }
  };
  return option;
};

/**
 * Callback to try to delete a custom block definitions.
 * @param {string} procCode The identifier of the procedure to delete.
 * @param {!Blockly.Block} definitionRoot The root block of the stack that
 *     defines the custom procedure.
 * @return {boolean} True if the custom procedure was deleted, false otherwise.
 * @package
 */
Blockly.Procedures.deleteProcedureDefCallback = function(procCode,
    definitionRoot) {
  var callers = Blockly.Procedures.getCallers(procCode,
      definitionRoot.workspace, definitionRoot, false /* allowRecursive */);
  if (callers.length > 0) {
    return false;
  }
  // Delete the whole stack.
  Blockly.Events.setGroup(true);
  definitionRoot.dispose();
  Blockly.Events.setGroup(false);
  return true;
};
