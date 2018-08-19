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
const { PanelBody, RangeControl, PanelColor, ColorPalette, SelectControl, IconButton, BaseControl } = wp.components;
const { Fragment } = wp.element;
const { createBlock, registerBlockType } = wp.blocks;
const { InspectorControls, InnerBlocks, MediaUpload } = wp.editor;

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


registerBlockType( 'cgb/columns', {
	title: sprintf(
		/* translators: Block title modifier */
		__( '%1$s (%2$s)' ),
		__( 'Container' ),
		__( 'beta' )
	),

	icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
	  <path fill="none" d="M0 0h24v24H0V0z"/>
	  <path d="M21 4H3L2 5v14l1 1h18l1-1V5zM6.4 18H4V6h2.4zm9.7 0H8V6h8zm3.9 0h-2.3l.1-12H20z"/>
	</svg>,

	category: 'layout',

	attributes: {
		columns: {
			type: 'number',
			default: 1,
		},
		backgroundColor: {
			type: 'string',
			selector: '.wp-block-cgb-columns',
		},
		columnsStructure: {
			type: 'string',
			default: '100',
		},
		structureList: {
			type: 'array'
		},
		paddingUnit: {
			type: 'string',
			default: 'px',
		},
		paddingTop: {
			type: 'number',
			default: 0,
		},
		paddingRight: {
			type: 'number',
			default: 0,
		},
		paddingBottom: {
			type: 'number',
			default: 0,
		},
		paddingLeft: {
			type: 'number',
			default: 0,
		},
		backgroundImage: {
			type: 'string',
			selector: '.wp-block-cgb-columns',
		},
		containerImgID: {
			type: 'number',
		},
		backgroundPosition: {
			type: 'string',
			selector: '.wp-block-cgb-columns',
			default: 'center',
		},
		backgroundSize: {
			type: 'string',
			selector: '.wp-block-cgb-columns',
			default: 'cover',
		},
		backgroundRepeat: {
			type: 'string',
			selector: '.wp-block-cgb-columns',
			default: 'no-repeat',
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

		const { columns, backgroundColor, columnsStructure, structureList, backgroundImage, containerImgID, backgroundPosition, backgroundSize, backgroundRepeat, paddingUnit, paddingTop, paddingRight, paddingBottom, paddingLeft } = attributes;

		const classes = classnames(
			className,
			`has-${ columns }-columns`,
			columnsStructure,
			{ 'bg-multiply' : backgroundImage && backgroundImage.length && backgroundColor && backgroundColor.length },
		);

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

		const onSelectImage = img => {
			setAttributes( {
				containerImgID: img.id,
				backgroundImage: img.url,
			} );
		};

		const onRemoveImage = () => {
			setAttributes({
				containerImgID: null,
				backgroundImage: null,
			});
		}

		const divStyle = {
			backgroundColor: backgroundColor,
			backgroundImage:  backgroundImage ? 'url(' + backgroundImage + ')' : undefined,
			backgroundPosition: backgroundPosition,
			backgroundSize: backgroundSize,
			backgroundRepeat: backgroundRepeat,
			paddingTop: paddingTop + paddingUnit,
			paddingRight: paddingRight + paddingUnit,
			paddingBottom: paddingBottom + paddingUnit,
			paddingLeft: paddingLeft + paddingUnit,
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
					<PanelBody title={ __( 'Spacing' ) } initialOpen={ false } >
						<SelectControl
							label={ __( 'Padding unit' ) }
							value={ paddingUnit } // e.g: value = [ 'a', 'c' ]
							onChange={ ( value ) => {
								setAttributes( { paddingUnit: value } )
							} }
							options={ [
									{ value: 'px', label: __( 'Px' ) },
									{ value: 'em', label: __( 'Em' ) },
									{ value: '%', label: __( 'Percent' ) },
							] }
						/>
						<BaseControl
								id="paddings"
								label="Padding"
							>
								<label for="padding-top">{ __( 'Top' ) }</label>
								<input
									id="padding-top"
									name="paddingTop"
									className="input-inline"
									type="number"
									min="0"
									value={ paddingTop }
									onChange={ ( event ) => {
										setAttributes( { paddingTop: event.target.value } )
									} }
								/>
								<label for="padding-right">{ __( 'Right' ) }</label>
								<input
									id="padding-right"
									name="paddingRight"
									className="input-inline"
									type="number"
									min="0"
									value={ paddingRight }
									onChange={ ( event ) => {
										setAttributes( { paddingRight: event.target.value } )
									} }
								/>
								<label for="padding-bottom">{ __( 'Bottom' ) }</label>
								<input
									id="padding-bottom"
									name="paddingBottom"
									className="input-inline"
									type="number"
									min="0"
									value={ paddingBottom }
									onChange={ ( event ) => {
										setAttributes( { paddingBottom: event.target.value } )
									} }
								/>
								<label for="padding-left">{ __( 'Left' ) }</label>
								<input
									id="padding-left"
									name="paddingLeft"
									className="input-inline"
									type="number"
									min="0"
									value={ paddingLeft }
									onChange={ ( event ) => {
										setAttributes( { paddingLeft: event.target.value } )
									} }
								/>
						</BaseControl>

					</PanelBody>
					<PanelBody title={ __( 'Background Options' ) } initialOpen={ false } >
						<p>{ __( 'Select a background color:' ) }</p>
							<ColorPalette
								label={ __( 'Background color' ) }
								value={ backgroundColor }
								onChange={ ( newBackgroundColor ) => {
									setAttributes( {
										backgroundColor: newBackgroundColor,
									} );
								} }
							/>
						<p>{ __( 'Select a background image:' ) }</p>
						<MediaUpload
							onSelect={ onSelectImage }
							type="image"
							value={ containerImgID }
							render={ ( { open } ) => (
								<div>
									<IconButton
										className="cgb-container-inspector-media"
										label={ __( 'Edit image' ) }
										icon="format-image"
										onClick={ open }
									>
										{ __( 'Select Image' ) }
									</IconButton>

									{ backgroundImage && !! backgroundImage.length && (
										<IconButton
											className="cgb-container-inspector-media"
											label={ __( 'Remove Image' ) }
											icon="dismiss"
											onClick={ onRemoveImage }
										>
											{ __( 'Remove' ) }
										</IconButton>
									) }
								</div>
							) }
						>
						</MediaUpload>

						{ backgroundImage && !! backgroundImage.length && (
						<div>
							<div>
							<SelectControl
								label={ __( 'Background position' ) }
								value={ backgroundPosition } // e.g: value = [ 'a', 'c' ]
								onChange={ ( bgPositionChoice ) => {
									setAttributes( { backgroundPosition: bgPositionChoice } )
								} }
								options={ [
									{ value: 'center', label: __( 'Center' ) },
									{ value: 'left', label: __( 'Left' ) },
									{ value: 'right', label: __( 'Right' ) },
									{ value: 'bottom', label: __( 'Bottom' ) },
									{ value: 'top', label: __( 'Top' ) },
								] }
							/>
							</div>
							<div>
							<SelectControl
								label={ __( 'Background Size' ) }
								value={ backgroundSize } // e.g: value = [ 'a', 'c' ]
								onChange={ ( bgSizeChoice ) => {
									setAttributes( { backgroundSize: bgSizeChoice } )
								} }
								options={ [
									{ value: 'cover', label: __( 'Cover' ) },
									{ value: 'contain', label: __( 'Contain' ) },
								] }
							/>
							</div>
							<div>
							<SelectControl
								label={ __( 'Background Repeat' ) }
								value={ backgroundRepeat } // e.g: value = [ 'a', 'c' ]
								onChange={ ( bgRepeatChoice ) => {
									setAttributes( { backgroundRepeat: bgRepeatChoice } )
								} }
								options={ [
									{ value: 'no-repeat', label: __( 'No repeat' ) },
									{ value: 'repeat', label: __( 'Repeat' ) },
									{ value: 'repeat-x', label: __( 'Repeat x' ) },
									{ value: 'repeat-y', label: __( 'Repeat y' ) },
								] }
							/>
							</div>
						</div>
						) }
					</PanelBody>
				</InspectorControls>
				<div className={ classes }
				style={ divStyle } >
					<InnerBlocks
						template={ getColumnsTemplate( columns ) }
						templateLock="all"
						allowedBlocks={ ALLOWED_BLOCKS } />
				</div>
			</Fragment>
		);
	},

	save( { attributes, className } ) {
		const { columns, columnsStructure, backgroundColor, backgroundImage, backgroundPosition, backgroundSize, backgroundRepeat, paddingUnit, paddingTop, paddingRight, paddingBottom, paddingLeft } = attributes;
		const divStyle = {
			backgroundColor: backgroundColor,
			backgroundImage:  backgroundImage ? 'url(' + backgroundImage + ')' : undefined,
			backgroundPosition: backgroundPosition,
			backgroundSize: backgroundSize,
			backgroundRepeat: backgroundRepeat,
			paddingTop: paddingTop + paddingUnit,
			paddingRight: paddingRight + paddingUnit,
			paddingBottom: paddingBottom + paddingUnit,
			paddingLeft: paddingLeft + paddingUnit,
		}

		const classes = classnames(
			className,
			`has-${ columns }-columns`,
			columnsStructure,
			{ 'bg-multiply' : backgroundImage && backgroundImage.length && backgroundColor && backgroundColor.length },
		);

		return (
			<div className={ classes } style={ divStyle } >
				<InnerBlocks.Content />
			</div>
		);
	},
} );
