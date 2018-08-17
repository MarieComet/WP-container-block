/**
 * WordPress dependencies
 */
const { __, sprintf } = wp.i18n;
const { InnerBlocks } = wp.editor;
const { registerBlockType } = wp.blocks;

registerBlockType( 'cgb/column', {
	title: __( 'Column' ),

	parent: [ 'cgb/block-columns-block' ],

	icon: 'columns',

	description: __( 'A single column within a columns block.' ),

	category: 'common',

	edit() {
		return <InnerBlocks templateLock={ false } />;
	},

	save() {
		return <div><InnerBlocks.Content /></div>;
	},
} );
