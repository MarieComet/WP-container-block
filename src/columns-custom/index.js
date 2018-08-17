/**
 * BLOCK: columns-block
 *
 * Registering a basic block with Gutenberg.
 * Simple block, renders and saves the same content without any interactivity.
 */

//  Import CSS.
import './style.scss';
import './editor.scss';

/**
 * External dependencies
 */
import times from 'lodash/times';
import property from 'lodash/property';
import omit from 'lodash/omit';
import classnames from 'classnames';
import memoize from 'memize';

/**
 * WordPress dependencies
 */
const { __, sprintf } = wp.i18n;
const { PanelBody, RangeControl, PanelColor, ColorPalette, SelectControl } = wp.components;
const { Fragment } = wp.element;
const { createBlock, registerBlockType } = wp.blocks;
const { InspectorControls, InnerBlocks } = wp.editor;

/**
 * Allowed blocks constant is passed to InnerBlocks precisely as specified here.
 * The contents of the array should never change.
 * The array should contain the name of each block that is allowed.
 * In columns block, the only block we allow is 'core/column'.
 *
 * @constant
 * @type {string[]}
*/
const ALLOWED_BLOCKS = [ 'cgb/column' ];

/**
 * Returns the layouts configuration for a given number of columns.
 *
 * @param {number} columns Number of columns.
 *
 * @return {Object[]} Columns layout configuration.
 */
const getColumnsTemplate = memoize( ( columns ) => {
	return times( columns, () => [ 'cgb/column' ] );
} );


registerBlockType( 'cgb/block-columns-block', {
	title: sprintf(
		/* translators: Block title modifier */
		__( '%1$s (%2$s)' ),
		__( 'Container' ),
		__( 'beta' )
	),

	icon: <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0V0z" /><g><path d="M21 4H3L2 5v14l1 1h18l1-1V5l-1-1zM8 18H4V6h4v12zm6 0h-4V6h4v12zm6 0h-4V6h4v12z" /></g></svg>,

	category: 'layout',

	attributes: {
		columns: {
			type: 'number',
			default: 1,
		},
		backgroundColor: {
			type: 'string',
			selector: '.wp-block-cgb-block-columns-block',
			default: '#fff',
		},
		columnsStructure: {
			type: 'string',
			default: '100',
		},
		structureList: {
			type: 'array'
		},

	},

	description: __( 'Add a block that displays content in multiple columns, then add whatever content blocks you’d like.' ),

	supports: {
		align: [ 'wide', 'full' ],
	},

	deprecated: [
		{
			attributes: {
				columns: {
					type: 'number',
					default: 2,
				},
			},
			isEligible( attributes, innerBlocks ) {
				return innerBlocks.some( property( [ 'attributes', 'layout' ] ) );
			},
			migrate( attributes, innerBlocks ) {
				function withoutLayout( block ) {
					return {
						...block,
						attributes: omit( block.attributes, [ 'layout' ] ),
					};
				}

				const columns = innerBlocks.reduce( ( result, innerBlock ) => {
					const { layout } = innerBlock.attributes;

					let columnIndex, columnMatch;
					if ( layout && ( columnMatch = layout.match( /^column-(\d+)$/ ) ) ) {
						columnIndex = Number( columnMatch[ 1 ] ) - 1;
					} else {
						columnIndex = 0;
					}

					if ( ! result[ columnIndex ] ) {
						result[ columnIndex ] = [];
					}

					result[ columnIndex ].push( withoutLayout( innerBlock ) );

					return result;
				}, [] );

				const migratedInnerBlocks = columns.map( ( columnBlocks ) => (
					createBlock( 'cgb/column', {}, columnBlocks )
				) );

				return [
					attributes,
					migratedInnerBlocks,
				];
			},
			save( { attributes } ) {
				const { columns } = attributes;

				return (
					<div className={ `has-${ columns }-columns` }>
						<InnerBlocks.Content />
					</div>
				);
			},
		},
	],

	edit( { attributes, setAttributes, className } ) {

		const { columns, backgroundColor, columnsStructure, structureList } = attributes;

		const classes = classnames( className, `has-${ columns }-columns`, columnsStructure );

		const updateStructureList = numberColumns => {

			setAttributes( {
				columns: numberColumns,
			} );

			let structureList = [ { value: '100', 'label': '100'} ]

			switch (numberColumns) {
			  case 1: structureList = [ { value: '100', 'label': '100'} ]
			    break;
			  case 2:
			    structureList = [
					{ value: 'half', label: '50-50' },
					{ value: 'one-third', label: '33-66' },
					{ value: 'third-one', label: '66-33' },
				]
			    break;
			  case 3:
			  	structureList = [
					{ value: 'thirds', label: '33-33-33' },
					{ value: 'quart-quart-half', label: '25-25-50' },
					{ value: 'half-quart-quart', label: '50-25-25' },
					{ value: 'quart-half-quart', label: '25-50-25' },
				]
			    break;
			  default:
			    structureList = [ { value: '100', 'label': '100'} ]
			}


			setAttributes( {
				structureList: structureList,
				columnsStructure: columnsStructure ? columnsStructure : structureList[0].value,
			} );
		}

		return (
			<Fragment>
				<InspectorControls>
					<PanelBody>
						<RangeControl
							label={ __( 'Columns' ) }
							value={ columns }
							onChange={ updateStructureList }
							min={ 1 }
							max={ 6 }
						/>
						<SelectControl
							label={ __( 'Structure' ) }
							value={ columnsStructure ? columnsStructure : '100' } // e.g: value = [ 'a', 'c' ]
							onChange={ ( structureChoice ) => {
								setAttributes( { columnsStructure: structureChoice } )
							} }
							options={ structureList }
						/>
					</PanelBody>
					<PanelBody>
						<PanelColor
							title={ __( 'Background color' ) }
							colorValue= { backgroundColor }
							initialOpen={ false }
						>
							<ColorPalette
								label={ __( 'Background color' ) }
								value={ backgroundColor }
								onChange={ ( newBackgroundColor ) => {
									setAttributes( {
										backgroundColor: newBackgroundColor,
									} );
								} }
							/>
						</PanelColor>
					</PanelBody>
				</InspectorControls>
				<div className={ classes }
				style={ {
					backgroundColor: backgroundColor
				} } >
					<InnerBlocks
						template={ getColumnsTemplate( columns ) }
						templateLock="all"
						allowedBlocks={ ALLOWED_BLOCKS } />
				</div>
			</Fragment>
		);
	},

	save( { attributes } ) {
		const { columns, columnsStructure, backgroundColor } = attributes;
		return (
			<div className={ `has-${ columns }-columns ${ columnsStructure }` } style={ { backgroundColor: backgroundColor } } >
				<InnerBlocks.Content />
			</div>
		);
	},
} );
