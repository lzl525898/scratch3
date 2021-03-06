import classNames from 'classnames';
import React from 'react';

import Box from '../box/box.jsx';
import LoadButton from '../../containers/load-button.jsx';
import SaveButton from '../../containers/save-button.jsx';
import LanguageSelector from '../../containers/language-selector.jsx';

import styles from './menu-bar.css';
//import scratchLogo from './scratch-logo.svg';
import scratchLogo from './logo.png';

const MenuBar = function MenuBar () {
    var hideLanguageSelector = false;
    return (
        <Box
            className={classNames({
                [styles.menuBar]: true
            })}
        >
            <div className={classNames(styles.logoWrapper, styles.menuItem)}>
                <img
                    className={styles.scratchLogo}
                    src={scratchLogo}
                />
            </div>
            <SaveButton className={styles.menuItem} />
            <LoadButton className={styles.menuItem} />
            {
              true==hideLanguageSelector
              ?
              <LanguageSelector className={styles.menuItem} />
              :
              <div></div>
            }
        </Box>
    );
};

export default MenuBar;
